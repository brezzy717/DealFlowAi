import { supabaseAdmin } from "@/lib/supabase/admin";
import { warmIntroEmail } from "@/lib/outreach/email-templates";
import { sendEmail, sendPostcard, bookingLinkFor } from "@/lib/outreach/adapters";
import { applyMetaExplanations } from "@/lib/scoring/meta-explain";

/**
 * Lead distribution — the core of the Tuesday 6 AM drop and onboarding's
 * first-batch assignment. Matches unassigned scored leads to a tenant's
 * parameters, respects "no duplicate lead ever," and returns the assignments.
 */

interface TenantParams {
  geo_states: string[] | null;
  geo_cities: string[] | null;
  geo_zips: string[] | null;
  revenue_min: number | null;
  revenue_max: number | null;
  employees_min: number | null;
  employees_max: number | null;
  min_years_in_business: number | null;
  industries_exclude: string[] | null;
}

/** Build a PostgREST filter chain from tenant parameters against businesses join. */
function matchesParams(biz: Record<string, unknown>, p: TenantParams): boolean {
  const state = biz.state as string | null;
  const city = biz.city as string | null;
  const zip = biz.zip_code as string | null;
  const rev = biz.revenue_estimate as number | null;
  const emp = biz.employee_count as number | null;
  const founded = biz.founded_date as string | null;
  const industry = biz.industry_category as string | null;

  const hasGeo = (p.geo_states?.length || p.geo_cities?.length || p.geo_zips?.length) ?? 0;
  if (hasGeo) {
    const geoHit =
      (p.geo_states?.length && state && p.geo_states.includes(state)) ||
      (p.geo_cities?.length && city && p.geo_cities.some((c) => c.toLowerCase().includes(city.toLowerCase()) || city.toLowerCase().includes(c.toLowerCase()))) ||
      (p.geo_zips?.length && zip && p.geo_zips.includes(zip));
    if (!geoHit) return false;
  }
  if (p.revenue_min != null && (rev ?? 0) < p.revenue_min) return false;
  if (p.revenue_max != null && (rev ?? Infinity) > p.revenue_max) return false;
  if (p.employees_min != null && (emp ?? 0) < p.employees_min) return false;
  if (p.employees_max != null && (emp ?? Infinity) > p.employees_max) return false;
  if (p.min_years_in_business != null && founded) {
    const years = new Date().getFullYear() - new Date(founded).getFullYear();
    if (years < p.min_years_in_business) return false;
  }
  if (p.industries_exclude?.length && industry && p.industries_exclude.some((x) => industry.toLowerCase().includes(x.toLowerCase().split(" ")[0]))) {
    return false;
  }
  return true;
}

export interface DistributionResult {
  tenantId: string;
  assigned: number;
  byTier: Record<string, number>;
  assignmentIds: string[];
  leadIds: string[];
}

/** Assign up to `perTier` fresh leads per tier to one tenant. */
export async function distributeToTenant(tenantId: string, perTier = 5): Promise<DistributionResult> {
  const admin = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  const { data: params } = await admin
    .from("tenant_parameters")
    .select("geo_states, geo_cities, geo_zips, revenue_min, revenue_max, employees_min, employees_max, min_years_in_business, industries_exclude")
    .eq("tenant_id", tenantId)
    .maybeSingle();

  const result: DistributionResult = { tenantId, assigned: 0, byTier: {}, assignmentIds: [], leadIds: [] };

  for (const tier of ["platinum", "gold", "silver"]) {
    // Pull a candidate window (over-fetch, filter in app, take perTier).
    // Platinum requires confidence >= 0.6 (the confidence gate).
    let q = admin
      .from("scored_leads")
      .select("id, confidence, lead_assignments!left(id), businesses!inner(state, city, zip_code, revenue_estimate, employee_count, founded_date, industry_category)")
      .eq("tier", tier)
      .is("lead_assignments", null)
      .order("final_score", { ascending: false })
      .limit(perTier * 8);
    if (tier === "platinum") q = q.gte("confidence", 0.6);

    const { data: candidates } = await q;
    if (!candidates?.length) continue;

    const chosen = [];
    for (const c of candidates) {
      const biz = Array.isArray(c.businesses) ? c.businesses[0] : c.businesses;
      if (params && !matchesParams(biz as Record<string, unknown>, params as TenantParams)) continue;
      chosen.push(c.id);
      if (chosen.length >= perTier) break;
    }
    if (!chosen.length) continue;

    const { data: inserted, error } = await admin
      .from("lead_assignments")
      .insert(chosen.map((id) => ({ scored_lead_id: id, tenant_id: tenantId, drop_date: today, status: "new" })))
      .select("id");
    if (error) continue; // unique violation = raced to another broker; skip
    result.assigned += inserted.length;
    result.byTier[tier] = inserted.length;
    result.assignmentIds.push(...inserted.map((r) => r.id));
    result.leadIds.push(...chosen);
  }

  // Meta Model: generate broker-facing natural-language explanations for the
  // leads being disbursed (spec Part 6). Template explanation stays as fallback.
  await applyMetaExplanations(result.leadIds);

  // Disbursement audit stamp
  await admin.from("audit_log").insert({
    action: "lead_distribution",
    target_type: "tenant",
    target_id: tenantId,
    detail: { drop_date: today, assigned: result.assigned, by_tier: result.byTier },
  });

  return result;
}

/** Day-1 warm email for a freshly assigned lead. Best-effort. */
export async function sendWarmEmail(assignmentId: string): Promise<boolean> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("lead_assignments")
    .select("tenant_id, scored_leads(ui_payload), tenants(company_name)")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!data) return false;

  const payload = (Array.isArray(data.scored_leads) ? data.scored_leads[0] : data.scored_leads)?.ui_payload as
    | { business?: { name?: string; industry?: string; owner?: { name?: string; email?: string } } }
    | undefined;
  const tenant = Array.isArray(data.tenants) ? data.tenants[0] : data.tenants;
  const biz = payload?.business;
  if (!biz?.owner?.email) return false;

  const email = warmIntroEmail({
    ownerFirstName: biz.owner.name?.split(" ")[0] ?? "there",
    businessName: biz.name ?? "your business",
    industry: biz.industry ?? "your industry",
    brokerName: tenant?.company_name ?? "your broker",
    brokerSignature: tenant?.company_name ?? "DealFlow AI",
    bookingLink: bookingLinkFor(data.tenant_id),
    dncLink: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://dealflow.ai"}/dnc/${assignmentId}`,
  });
  const res = await sendEmail(biz.owner.email, email.subject, email.html);

  // Day-1 USPS postcards (business + owner home). Requires a real street
  // address — synthetic seed data has none, so live Lob spend only starts
  // once real ingestion provides verified addresses.
  const bizFull = payload?.business as
    | { name?: string; streetAddress?: string; city?: string; state?: string; zip?: string; owner?: { name?: string } }
    | undefined;
  if (bizFull?.streetAddress && bizFull.city && bizFull.state && bizFull.zip) {
    await sendPostcard({
      toName: bizFull.owner?.name ?? bizFull.name ?? "Business Owner",
      address: { line1: bizFull.streetAddress, city: bizFull.city, state: bizFull.state, zip: bizFull.zip },
      templateId: process.env.LOB_TEMPLATE_ID ?? "tmpl_default",
      qrUrl: bookingLinkFor(data.tenant_id),
    });
  }
  return res.ok;
}
