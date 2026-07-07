import { supabaseServer, supabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin, adminConfigured } from "@/lib/supabase/admin";
import { LeadStatus, ScoredLead } from "@/lib/types";

/**
 * Live read path. Returns null when Supabase isn't configured, the visitor
 * isn't signed in, or the tenant has no assignments yet — callers fall back
 * to the synthetic demo book, so the app degrades gracefully everywhere.
 */
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
    .select("status, drop_date, assigned_at, scored_leads(ui_payload, final_score, tier)")
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
    leads.push({ ...payload, status: r.status as LeadStatus, dropWeeksAgo: weeks });
  }
  return leads.length ? leads : null;
}
