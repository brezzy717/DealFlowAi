import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, supabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Stage-1 outreach feedback — the ML training signal. Writes an
 * outreach_feedback row, an ml_training_data example with the outcome_quality
 * score from the spec, and advances the assignment status.
 */
const QUALITY: Record<string, number> = {
  booked: 0.8,
  future_interest: 0.6,
  not_interested: 0.2,
  no_answer: 0.1,
  dnc: 0.0,
};

const NEXT_STATUS: Record<string, string> = {
  booked: "meeting_scheduled",
  future_interest: "contacted",
  not_interested: "contacted",
  no_answer: "contacted",
  dnc: "dnc",
};

export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const supa = await supabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { assignmentId, outcome, reason } = (await req.json()) as {
    assignmentId: string;
    outcome: keyof typeof QUALITY;
    reason?: string;
  };
  if (!(outcome in QUALITY)) return NextResponse.json({ error: "bad outcome" }, { status: 400 });

  const admin = supabaseAdmin();
  // Confirm the assignment belongs to this user's tenant
  const { data: tu } = await admin.from("tenant_users").select("tenant_id").eq("auth_user_id", user.id).maybeSingle();
  const { data: assignment } = await admin
    .from("lead_assignments")
    .select("id, tenant_id, scored_leads(id, feature_vector)")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!assignment || !tu || assignment.tenant_id !== tu.tenant_id) {
    return NextResponse.json({ error: "not your lead" }, { status: 403 });
  }

  await admin.from("outreach_feedback").insert({
    assignment_id: assignmentId,
    outcome,
    outcome_reason: reason || `${outcome} (logged by broker)`,
    feedback_source: "broker",
    contact_date: new Date().toISOString(),
  });

  const sl = Array.isArray(assignment.scored_leads) ? assignment.scored_leads[0] : assignment.scored_leads;
  await admin.from("ml_training_data").insert({
    scored_lead_id: sl?.id,
    feature_vector: sl?.feature_vector ?? {},
    feature_version: 3,
    actual_outcome: outcome,
    outcome_quality_score: QUALITY[outcome],
    confidence_level: "high",
  });

  await admin
    .from("lead_assignments")
    .update({
      status: NEXT_STATUS[outcome],
      ...(outcome === "dnc" ? { deactivated_at: new Date().toISOString() } : {}),
      first_contact_at: new Date().toISOString(),
    })
    .eq("id", assignmentId);

  return NextResponse.json({ ok: true, quality: QUALITY[outcome] });
}
