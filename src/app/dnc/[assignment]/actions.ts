"use server";

import { supabaseAdmin, adminConfigured } from "@/lib/supabase/admin";

/**
 * Do-Not-Contact — the one-click link in every outreach email. Deactivates the
 * lead immediately, logs the DNC for compliance, and records the training
 * signal (quality 0.0). No auth required: the assignment id is the token.
 */
export async function submitDnc(assignmentId: string): Promise<{ ok: boolean }> {
  if (!adminConfigured()) return { ok: true };
  const admin = supabaseAdmin();

  const { data: assignment } = await admin
    .from("lead_assignments")
    .select("id, scored_leads(id, feature_vector)")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!assignment) return { ok: false };

  await admin.from("outreach_feedback").insert({
    assignment_id: assignmentId,
    outcome: "dnc",
    outcome_reason: "Recipient used the one-click do-not-contact link",
    feedback_source: "ai_agent",
    contact_date: new Date().toISOString(),
  });

  const sl = Array.isArray(assignment.scored_leads) ? assignment.scored_leads[0] : assignment.scored_leads;
  await admin.from("ml_training_data").insert({
    scored_lead_id: sl?.id,
    feature_vector: sl?.feature_vector ?? {},
    feature_version: 3,
    actual_outcome: "dnc",
    outcome_quality_score: 0.0,
    confidence_level: "high",
  });

  await admin
    .from("lead_assignments")
    .update({ status: "dnc", deactivated_at: new Date().toISOString(), clawback_reason: "dnc_request" })
    .eq("id", assignmentId);

  await admin.from("audit_log").insert({
    action: "dnc_request",
    target_type: "lead_assignment",
    target_id: assignmentId,
    detail: { channel: "email_one_click" },
  });

  return { ok: true };
}
