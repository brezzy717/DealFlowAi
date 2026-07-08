import { supabaseServer, supabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin, adminConfigured } from "@/lib/supabase/admin";
import { LeadStatus, ScoredLead } from "@/lib/types";

/**
 * Live read path. Returns null when Supabase isn't configured, the visitor
 * isn't signed in, or the tenant has no assignments yet — callers fall back
 * to the synthetic demo book, so the app degrades gracefully everywhere.
 */
export async function getLiveTenant(): Promise<{ tenantId: string; companyName: string } | null> {
  if (!supabaseConfigured() || !adminConfigured()) return null;
  const supa = await supabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return null;
  const admin = supabaseAdmin();
  const { data: tu } = await admin
    .from("tenant_users")
    .select("tenant_id, tenants(company_name)")
    .eq("auth_user_id", user.id)
    .maybeSingle();
  if (!tu) return null;
  const t = Array.isArray(tu.tenants) ? tu.tenants[0] : tu.tenants;
  return { tenantId: tu.tenant_id, companyName: t?.company_name ?? "Your brokerage" };
}

export interface LiveTenantRow {
  id: string;
  broker: string;
  company: string;
  email: string;
  tier: 1 | 2;
  status: "active" | "past_due" | "churned";
  leadsAssigned: number;
  contactedPct: number;
  mrr: number;
  joined: string;
  lastActive: string;
}

/** All tenants with real assignment/contact counts — for the admin dashboard. */
export async function getLiveTenants(): Promise<LiveTenantRow[] | null> {
  if (!adminConfigured()) return null;
  const admin = supabaseAdmin();
  const [{ data: tenants }, { data: assignments }, { data: users }] = await Promise.all([
    admin.from("tenants").select("id, company_name, tier, status, created_at, updated_at"),
    admin.from("lead_assignments").select("tenant_id, first_contact_at"),
    admin.from("tenant_users").select("tenant_id, email, full_name"),
  ]);
  if (!tenants?.length) return null;

  return tenants.map((t) => {
    const rows = (assignments ?? []).filter((a) => a.tenant_id === t.id);
    const contacted = rows.filter((a) => a.first_contact_at).length;
    const u = (users ?? []).find((x) => x.tenant_id === t.id);
    return {
      id: t.id,
      broker: u?.full_name || u?.email || "—",
      company: t.company_name,
      email: u?.email ?? "",
      tier: (t.tier ?? 1) as 1 | 2,
      status: (t.status ?? "active") as "active",
      leadsAssigned: rows.length,
      contactedPct: rows.length ? Math.round((contacted / rows.length) * 100) : 0,
      mrr: t.tier === 2 ? 5500 : 2400,
      joined: t.created_at,
      lastActive: t.updated_at,
    };
  });
}

export interface LiveClient {
  id: string;
  name: string;
  business: string;
  email: string;
  phone: string;
  source: "converted" | "imported";
  since: string;
  status: "active_deal" | "closed" | "nurture";
}

/** Clients derived from this tenant's booked/in-pipeline assignments. */
export async function getLiveClients(tenantId: string): Promise<LiveClient[] | null> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("lead_assignments")
    .select("id, status, assigned_at, scored_leads(ui_payload)")
    .eq("tenant_id", tenantId)
    .in("status", ["meeting_scheduled", "in_pipeline"])
    .order("assigned_at", { ascending: false });
  if (!data?.length) return null;
  return data.map((r) => {
    const sl = Array.isArray(r.scored_leads) ? r.scored_leads[0] : r.scored_leads;
    const p = sl?.ui_payload as { business?: { name?: string; owner?: { name?: string; email?: string; phone?: string } } } | undefined;
    const b = p?.business;
    return {
      id: r.id,
      name: b?.owner?.name ?? "Owner",
      business: b?.name ?? "—",
      email: b?.owner?.email ?? "",
      phone: b?.owner?.phone ?? "",
      source: "converted" as const,
      since: r.assigned_at,
      status: "active_deal" as const,
    };
  });
}

export interface LiveAppointment {
  id: string;
  startsAt: string;
  kind: string | null;
  source: string | null;
  status: string | null;
  guestName: string | null;
  guestCompany: string | null;
}

export async function getLiveAppointments(tenantId: string): Promise<LiveAppointment[]> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("appointments")
    .select("id, starts_at, kind, source, status, guest_name, guest_company")
    .eq("tenant_id", tenantId)
    .neq("status", "cancelled")
    .gte("starts_at", new Date(Date.now() - 24 * 3600 * 1000).toISOString())
    .order("starts_at", { ascending: true });
  return (data ?? []).map((r) => ({
    id: r.id,
    startsAt: r.starts_at,
    kind: r.kind,
    source: r.source,
    status: r.status,
    guestName: r.guest_name,
    guestCompany: r.guest_company,
  }));
}

export async function getLiveBook(): Promise<ScoredLead[] | null> {
  if (!supabaseConfigured() || !adminConfigured()) return null;

  const supa = await supabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return null;

  const admin = supabaseAdmin();
  const { data: tu } = await admin.from("tenant_users").select("tenant_id").eq("auth_user_id", user.id).maybeSingle();
  if (!tu) return null;

  const { data: rows, error } = await admin
    .from("lead_assignments")
    .select("id, status, drop_date, assigned_at, scored_leads(ui_payload, final_score, tier)")
    .eq("tenant_id", tu.tenant_id)
    .not("status", "in", "(clawed_back,dnc)")
    .order("assigned_at", { ascending: false });
  if (error || !rows?.length) return null;

  const now = Date.now();
  const leads: ScoredLead[] = [];
  for (const r of rows) {
    const sl = Array.isArray(r.scored_leads) ? r.scored_leads[0] : r.scored_leads;
    const payload = sl?.ui_payload as Omit<ScoredLead, "status" | "dropWeeksAgo"> | undefined;
    if (!payload) continue;
    const weeks = Math.max(0, Math.floor((now - new Date(r.drop_date).getTime()) / (7 * 24 * 3600 * 1000)));
    leads.push({ ...payload, status: r.status as LeadStatus, dropWeeksAgo: weeks, assignmentId: r.id });
  }
  return leads.length ? leads : null;
}
