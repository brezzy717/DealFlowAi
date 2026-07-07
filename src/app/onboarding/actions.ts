"use server";

import { supabaseAdmin, adminConfigured } from "@/lib/supabase/admin";
import { supabaseServer, supabaseConfigured } from "@/lib/supabase/server";
import { DEFAULT_AVAILABILITY } from "@/lib/scheduling";
import { distributeToTenant, sendWarmEmail } from "@/lib/distribution";

export interface OnboardingPayload {
  tier: 1 | 2;
  geo: string;
  revMin: string;
  revMax: string;
  empMin: string;
  years: string;
  exclude: string[];
  signature: string;
}

/**
 * Creates tenant + parameters + progress rows, then distributes the first
 * batch of 15 seeded leads (5 per tier) to the new broker.
 */
export async function completeOnboarding(payload: OnboardingPayload): Promise<{ ok: boolean; error?: string }> {
  if (!supabaseConfigured() || !adminConfigured()) {
    return { ok: true }; // demo mode — nothing to persist
  }
  const supa = await supabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const admin = supabaseAdmin();

  // Idempotent: reuse tenant if this user already onboarded
  const { data: existing } = await admin.from("tenant_users").select("tenant_id").eq("auth_user_id", user.id).maybeSingle();
  let tenantId = existing?.tenant_id as string | undefined;

  if (!tenantId) {
    const companyName = (user.user_metadata?.company_name as string) || user.email?.split("@")[0] || "New Brokerage";
    const { data: tenant, error: tErr } = await admin
      .from("tenants")
      .insert({ company_name: companyName, tier: payload.tier, ai_calling_concierge_enabled: payload.tier === 2 })
      .select("id")
      .single();
    if (tErr) return { ok: false, error: tErr.message };
    tenantId = tenant.id;

    const { error: uErr } = await admin.from("tenant_users").insert({
      tenant_id: tenantId,
      auth_user_id: user.id,
      email: user.email,
      full_name: (user.user_metadata?.full_name as string) ?? null,
    });
    if (uErr) return { ok: false, error: uErr.message };

    // Default booking availability: Mon–Fri 9–5 Phoenix (editable later in Settings)
    await admin.from("broker_availability").insert(
      DEFAULT_AVAILABILITY.map((w) => ({ tenant_id: tenantId, ...w })),
    );
  }

  const geoParts = payload.geo.split(",").map((s) => s.trim()).filter(Boolean);
  await admin.from("tenant_parameters").upsert(
    {
      tenant_id: tenantId,
      geo_cities: geoParts.filter((g) => !/^\d{5}$/.test(g)),
      geo_zips: geoParts.filter((g) => /^\d{5}$/.test(g)),
      revenue_min: payload.revMin ? Number(payload.revMin) : null,
      revenue_max: payload.revMax ? Number(payload.revMax) : null,
      employees_min: payload.empMin ? Number(payload.empMin) : null,
      min_years_in_business: payload.years ? Number(payload.years) : null,
      industries_exclude: payload.exclude,
    },
    { onConflict: "tenant_id" },
  );

  await admin.from("onboarding_progress").upsert({
    tenant_id: tenantId,
    payment_complete: true,
    parameters_configured: true,
    ai_concierge_decision_made: true,
    agreement_signed_at: new Date().toISOString(),
    agreement_signature: payload.signature,
    onboarding_complete: true,
  });

  // First batch: distribute matching leads, then fire the Day-1 warm emails
  const dist = await distributeToTenant(tenantId!, 5);
  await Promise.all(dist.assignmentIds.map((id) => sendWarmEmail(id)));
  return { ok: true };
}
