"use server";

import { supabaseServer, supabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export interface DealRoomMessage {
  id: string;
  sender: "broker" | "owner";
  body: string;
  created_at: string;
}

async function tenantForUser() {
  const supa = await supabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  if (!user) return null;
  const admin = supabaseAdmin();
  const { data } = await admin.from("tenant_users").select("tenant_id").eq("auth_user_id", user.id).maybeSingle();
  return data?.tenant_id ?? null;
}

/** Ensure a thread exists for this tenant + client label; return its id + history. */
export async function openThread(clientKey: string): Promise<{ threadId: string; messages: DealRoomMessage[] } | null> {
  if (!supabaseConfigured()) return null;
  const tenantId = await tenantForUser();
  if (!tenantId) return null;
  const admin = supabaseAdmin();

  // clientKey is a stable label per room; reuse or create the thread
  const { data: existing } = await admin
    .from("dealroom_threads")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("label", clientKey)
    .maybeSingle();

  let threadId = existing?.id as string | undefined;
  if (!threadId) {
    const { data, error } = await admin
      .from("dealroom_threads")
      .insert({ tenant_id: tenantId, label: clientKey })
      .select("id")
      .single();
    if (error) return null;
    threadId = data.id;
  }

  const { data: msgs } = await admin
    .from("dealroom_messages")
    .select("id, sender, body, created_at")
    .eq("thread_id", threadId)
    .order("created_at", { ascending: true });

  return { threadId: threadId as string, messages: (msgs ?? []) as DealRoomMessage[] };
}

export async function sendMessage(threadId: string, body: string): Promise<{ ok: boolean }> {
  if (!supabaseConfigured() || !body.trim()) return { ok: false };
  const tenantId = await tenantForUser();
  if (!tenantId) return { ok: false };
  const admin = supabaseAdmin();
  const { data: thread } = await admin.from("dealroom_threads").select("tenant_id").eq("id", threadId).maybeSingle();
  if (thread?.tenant_id !== tenantId) return { ok: false };
  const { error } = await admin.from("dealroom_messages").insert({ thread_id: threadId, sender: "broker", body: body.trim() });
  return { ok: !error };
}
