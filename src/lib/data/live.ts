import { supabaseServer, supabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin, adminConfigured } from "@/lib/supabase/admin";
import { LeadStatus, ScoredLead, Tier } from "@/lib/types";
import { Deal, PipelineStage, TaskItem, CallLog } from "@/lib/data/crm";

type UiPayload = {
  tier?: string;
  business?: {
    name?: string;
    industry?: string;
    city?: string;
    state?: string;
    revenueEstimate?: number;
    owner?: { name?: string; email?: string; phone?: string };
  };
};

const payloadOf = (sl: unknown): UiPayload | undefined => {
  const row = Array.isArray(sl) ? sl[0] : sl;
  return (row as { ui_payload?: UiPayload } | null)?.ui_payload;
};

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

/** Live deals joined back to their lead payloads for display. */
export async function getLiveDeals(tenantId: string): Promise<Deal[] | null> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("deals")
    .select("id, stage, est_value, commission_pct, stage_entered_at, lead_assignments(scored_leads(ui_payload))")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: true });
  if (!data?.length) return null;
  return data.map((d) => {
    const la = Array.isArray(d.lead_assignments) ? d.lead_assignments[0] : d.lead_assignments;
    const p = payloadOf(la?.scored_leads);
    return {
      id: d.id,
      business: p?.business?.name ?? "—",
      ownerName: p?.business?.owner?.name ?? "—",
      industry: p?.business?.industry ?? "—",
      city: p?.business ? `${p.business.city}, ${p.business.state}` : "—",
      estValue: Number(d.est_value ?? 0),
      commissionPct: Number(d.commission_pct ?? 10),
      stage: d.stage as PipelineStage,
      daysInStage: Math.max(0, Math.floor((Date.now() - new Date(d.stage_entered_at).getTime()) / 86400000)),
      tier: p?.tier ?? "gold",
    };
  });
}

/** Live tasks: rows from the tasks table + auto outreach-action items. */
export async function getLiveTasks(tenantId: string): Promise<TaskItem[] | null> {
  const admin = supabaseAdmin();
  const [{ data: rows }, { data: pending }] = await Promise.all([
    admin.from("tasks").select("id, title, kind, due_date, done").eq("tenant_id", tenantId).order("created_at"),
    admin
      .from("lead_assignments")
      .select("id, scored_leads(ui_payload)")
      .eq("tenant_id", tenantId)
      .eq("status", "new"),
  ]);
  const auto: TaskItem[] = (pending ?? []).map((a) => ({
    id: `auto_${a.id}`,
    title: `Action outreach outcome — ${payloadOf(a.scored_leads)?.business?.name ?? "lead"}`,
    kind: "action_outreach",
    due: new Date().toISOString(),
    done: false,
    ref: a.id,
  }));
  const manual: TaskItem[] = (rows ?? []).map((t) => ({
    id: t.id,
    title: t.title,
    kind: (t.kind ?? "todo") as TaskItem["kind"],
    due: t.due_date ?? new Date().toISOString(),
    done: Boolean(t.done),
  }));
  const all = [...auto, ...manual];
  return all.length ? all : null;
}

export interface LiveReportStats {
  assignedByTier: Record<string, number>;
  convertedByTier: Record<string, number>;
  appointments: number;
  outcomes: Record<string, number>;
  pipelineValue: number;
  commissionsYtd: number;
  dealsClosed: number;
}

export async function getLiveReportStats(tenantId: string): Promise<LiveReportStats | null> {
  const admin = supabaseAdmin();
  const [{ data: assigns }, { data: appts }, { data: fb }, { data: deals }, { data: df }] = await Promise.all([
    admin.from("lead_assignments").select("status, scored_leads(tier)").eq("tenant_id", tenantId),
    admin.from("appointments").select("id").eq("tenant_id", tenantId).neq("status", "cancelled"),
    admin.from("outreach_feedback").select("outcome, lead_assignments!inner(tenant_id)").eq("lead_assignments.tenant_id", tenantId),
    admin.from("deals").select("est_value, commission_pct, stage").eq("tenant_id", tenantId),
    admin.from("deal_feedback").select("commission_amount, outcome, lead_assignments!inner(tenant_id)").eq("lead_assignments.tenant_id", tenantId),
  ]);
  if (!assigns?.length) return null;

  const assignedByTier: Record<string, number> = {};
  const convertedByTier: Record<string, number> = {};
  for (const a of assigns) {
    const tier = ((Array.isArray(a.scored_leads) ? a.scored_leads[0] : a.scored_leads) as { tier?: string } | null)?.tier ?? "?";
    assignedByTier[tier] = (assignedByTier[tier] ?? 0) + 1;
    if (a.status === "meeting_scheduled" || a.status === "in_pipeline") convertedByTier[tier] = (convertedByTier[tier] ?? 0) + 1;
  }
  const outcomes: Record<string, number> = {};
  for (const f of fb ?? []) outcomes[f.outcome] = (outcomes[f.outcome] ?? 0) + 1;

  return {
    assignedByTier,
    convertedByTier,
    appointments: appts?.length ?? 0,
    outcomes,
    pipelineValue: (deals ?? []).filter((d) => d.stage !== "Funded & Closed").reduce((a, d) => a + Number(d.est_value ?? 0), 0),
    commissionsYtd: (df ?? []).reduce((a, r) => a + Number(r.commission_amount ?? 0), 0),
    dealsClosed: (df ?? []).filter((r) => r.outcome === "sold").length,
  };
}

export async function getLiveCallLogs(tenantId: string): Promise<CallLog[] | null> {
  const admin = supabaseAdmin();
  const { data } = await admin
    .from("call_logs")
    .select("id, called_at, duration_sec, attempt, outcome, transcript, lead_assignments(scored_leads(ui_payload))")
    .eq("tenant_id", tenantId)
    .order("called_at", { ascending: false })
    .limit(25);
  if (!data?.length) return null;
  return data.map((c) => {
    const la = Array.isArray(c.lead_assignments) ? c.lead_assignments[0] : c.lead_assignments;
    const p = payloadOf(la?.scored_leads);
    return {
      id: c.id,
      leadName: p?.business?.name ?? "—",
      ownerName: p?.business?.owner?.name ?? "—",
      when: c.called_at,
      durationSec: c.duration_sec ?? 0,
      attempt: c.attempt ?? 1,
      outcome: (c.outcome ?? "pending_action") as CallLog["outcome"],
      transcriptSnippet: c.transcript ?? "Recording/transcript attach when the call completes.",
    };
  });
}

export interface LivePoolStats {
  byTier: Record<Tier, { total: number; unassigned: number }>;
  histogram: { label: string; value: number }[];
}

export async function getLivePoolStats(): Promise<LivePoolStats | null> {
  if (!adminConfigured()) return null;
  const admin = supabaseAdmin();
  const { data } = await admin.from("scored_leads").select("tier, final_score, lead_assignments!left(id)");
  if (!data?.length) return null;
  const byTier = { platinum: { total: 0, unassigned: 0 }, gold: { total: 0, unassigned: 0 }, silver: { total: 0, unassigned: 0 }, black: { total: 0, unassigned: 0 } } as LivePoolStats["byTier"];
  const histogram = Array.from({ length: 10 }, (_, i) => ({ label: `${i * 10}`, value: 0 }));
  for (const r of data) {
    const t = r.tier as Tier;
    byTier[t].total++;
    const assigned = Array.isArray(r.lead_assignments) ? r.lead_assignments.length > 0 : Boolean(r.lead_assignments);
    if (!assigned) byTier[t].unassigned++;
    histogram[Math.min(9, Math.floor(Number(r.final_score) / 10))].value++;
  }
  return { byTier, histogram };
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
