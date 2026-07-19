"use server";

import { revalidatePath } from "next/cache";
import { supabaseServer, supabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PIPELINE_STAGES, PipelineStage } from "@/lib/data/crm";

async function currentTenantId(): Promise<string | null> {
  if (!supabaseConfigured()) return null;
  const supa = await supabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return null;
  const admin = supabaseAdmin();
  const { data } = await admin.from("tenant_users").select("tenant_id").eq("auth_user_id", user.id).maybeSingle();
  return data?.tenant_id ?? null;
}

// ── Pipeline ──────────────────────────────────────────────────────────────
export async function moveDealStage(dealId: string, stage: PipelineStage): Promise<{ ok: boolean }> {
  const tenantId = await currentTenantId();
  if (!tenantId || !PIPELINE_STAGES.includes(stage)) return { ok: false };
  const admin = supabaseAdmin();
  const { error } = await admin
    .from("deals")
    .update({ stage, stage_entered_at: new Date().toISOString() })
    .eq("id", dealId)
    .eq("tenant_id", tenantId);
  return { ok: !error };
}

/** "Move to Pipeline" on a lead card: creates a deal + flips the assignment. */
export async function createDealFromAssignment(assignmentId: string): Promise<{ ok: boolean; error?: string }> {
  const tenantId = await currentTenantId();
  if (!tenantId) return { ok: false, error: "not signed in" };
  const admin = supabaseAdmin();

  const { data: a } = await admin
    .from("lead_assignments")
    .select("id, tenant_id, scored_leads(ui_payload)")
    .eq("id", assignmentId)
    .maybeSingle();
  if (!a || a.tenant_id !== tenantId) return { ok: false, error: "not your lead" };

  const { data: existing } = await admin.from("deals").select("id").eq("assignment_id", assignmentId).maybeSingle();
  if (existing) return { ok: true };

  const payload = (Array.isArray(a.scored_leads) ? a.scored_leads[0] : a.scored_leads)?.ui_payload as
    | { business?: { revenueEstimate?: number } }
    | undefined;
  const est = Math.round(((payload?.business?.revenueEstimate ?? 1_000_000) * 0.6) / 10000) * 10000;

  const { error } = await admin.from("deals").insert({
    tenant_id: tenantId,
    assignment_id: assignmentId,
    stage: "Representation Signed",
    est_value: est,
    commission_pct: 10,
  });
  if (error) return { ok: false, error: error.message };
  await admin.from("lead_assignments").update({ status: "in_pipeline" }).eq("id", assignmentId);
  revalidatePath("/dashboard/pipeline");
  return { ok: true };
}

// ── Tasks ─────────────────────────────────────────────────────────────────
export async function addTask(title: string): Promise<{ ok: boolean; id?: string }> {
  const tenantId = await currentTenantId();
  if (!tenantId || !title.trim()) return { ok: false };
  const admin = supabaseAdmin();
  const { data, error } = await admin
    .from("tasks")
    .insert({ tenant_id: tenantId, title: title.trim(), kind: "todo", due_date: new Date().toISOString().slice(0, 10) })
    .select("id")
    .single();
  return { ok: !error, id: data?.id };
}

export async function setTaskDone(taskId: string, done: boolean): Promise<{ ok: boolean }> {
  const tenantId = await currentTenantId();
  if (!tenantId) return { ok: false };
  const admin = supabaseAdmin();
  const { error } = await admin.from("tasks").update({ done }).eq("id", taskId).eq("tenant_id", tenantId);
  return { ok: !error };
}

export async function removeTask(taskId: string): Promise<{ ok: boolean }> {
  const tenantId = await currentTenantId();
  if (!tenantId) return { ok: false };
  const admin = supabaseAdmin();
  const { error } = await admin.from("tasks").delete().eq("id", taskId).eq("tenant_id", tenantId);
  return { ok: !error };
}

// ── Vault ─────────────────────────────────────────────────────────────────
export async function uploadVaultDoc(formData: FormData): Promise<{ ok: boolean; error?: string }> {
  const tenantId = await currentTenantId();
  if (!tenantId) return { ok: false, error: "not signed in" };
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) return { ok: false, error: "no file" };
  if (file.size > 25 * 1024 * 1024) return { ok: false, error: "max 25MB" };

  const admin = supabaseAdmin();
  const path = `${tenantId}/${Date.now()}_${file.name.replace(/[^\w.\-]+/g, "_")}`;
  const { error: upErr } = await admin.storage.from("vault").upload(path, file, { contentType: file.type });
  if (upErr) return { ok: false, error: upErr.message };

  await admin.from("vault_documents").insert({
    tenant_id: tenantId,
    name: file.name,
    storage_path: path,
    mime_type: file.type,
    size_kb: Math.round(file.size / 1024),
    builtin: false,
  });
  revalidatePath("/dashboard/vault");
  return { ok: true };
}

export async function vaultDownloadUrl(docId: string): Promise<{ url?: string }> {
  const tenantId = await currentTenantId();
  if (!tenantId) return {};
  const admin = supabaseAdmin();
  const { data: doc } = await admin
    .from("vault_documents")
    .select("storage_path")
    .eq("id", docId)
    .eq("tenant_id", tenantId)
    .maybeSingle();
  if (!doc?.storage_path) return {};
  const { data } = await admin.storage.from("vault").createSignedUrl(doc.storage_path, 3600);
  return { url: data?.signedUrl };
}

// ── Settings ──────────────────────────────────────────────────────────────
export async function updateTenantSettings(input: {
  tier?: 1 | 2;
  aiConcierge?: boolean;
  pauseDrops?: boolean;
}): Promise<{ ok: boolean }> {
  const tenantId = await currentTenantId();
  if (!tenantId) return { ok: false };
  const admin = supabaseAdmin();
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (input.tier) patch.tier = input.tier;
  if (input.aiConcierge !== undefined) patch.ai_calling_concierge_enabled = input.aiConcierge;
  if (input.pauseDrops !== undefined) {
    patch.pause_drops_until = input.pauseDrops
      ? new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10)
      : null;
  }
  const { error } = await admin.from("tenants").update(patch).eq("id", tenantId);
  return { ok: !error };
}
