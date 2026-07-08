import { NextRequest, NextResponse } from "next/server";
import { supabaseServer, supabaseConfigured } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Lead clawback (spec: admin-only revoke/reassign). Removes uncontacted
 * assignments so the unique constraint frees those leads back into the color
 * pool for the next disbursement; the compliance trail lives in audit_log.
 * Body: { tenantId } (all uncontacted) or { assignmentId } (single).
 */
export async function POST(req: NextRequest) {
  if (!supabaseConfigured()) return NextResponse.json({ error: "not configured" }, { status: 503 });
  const supa = await supabaseServer();
  const {
    data: { user },
  } = await supa.auth.getUser();
  // TODO: role check (tenant_users.role = 'admin') once admin accounts exist
  if (!user && process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { tenantId, assignmentId } = (await req.json()) as { tenantId?: string; assignmentId?: string };
  const admin = supabaseAdmin();

  let query = admin.from("lead_assignments").select("id, scored_lead_id, tenant_id, status, first_contact_at");
  if (assignmentId) query = query.eq("id", assignmentId);
  else if (tenantId) query = query.eq("tenant_id", tenantId).is("first_contact_at", null).eq("status", "new");
  else return NextResponse.json({ error: "tenantId or assignmentId required" }, { status: 400 });

  const { data: targets } = await query;
  if (!targets?.length) return NextResponse.json({ ok: true, clawedBack: 0 });

  const ids = targets.map((t) => t.id);
  await admin.from("audit_log").insert(
    targets.map((t) => ({
      actor: user?.id ?? null,
      action: "lead_clawback",
      target_type: "lead_assignment",
      target_id: t.id,
      detail: { scored_lead_id: t.scored_lead_id, tenant_id: t.tenant_id, reason: assignmentId ? "manual_single" : "uncontacted_bulk" },
    })),
  );
  const { error } = await admin.from("lead_assignments").delete().in("id", ids);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true, clawedBack: ids.length });
}
