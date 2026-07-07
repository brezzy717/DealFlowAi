import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin, adminConfigured } from "@/lib/supabase/admin";
import { distributeToTenant, sendWarmEmail } from "@/lib/distribution";

/**
 * Manual trigger for the weekly drop (admin/testing) — same logic the Tuesday
 * cron runs, so you don't have to wait until Tuesday to see it work.
 * POST /api/admin/run-drop   Authorization: Bearer <SUPABASE_SECRET_KEY>
 * Body (optional): { tenantId, perTier, sendEmails }
 */
export async function POST(req: NextRequest) {
  if (!adminConfigured()) return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY}`;
  if (process.env.NODE_ENV !== "development" && auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { tenantId?: string; perTier?: number; sendEmails?: boolean };
  const admin = supabaseAdmin();
  const today = new Date().toISOString().slice(0, 10);

  let tenantIds: string[];
  if (body.tenantId) {
    tenantIds = [body.tenantId];
  } else {
    const { data } = await admin.from("tenants").select("id, pause_drops_until").eq("status", "active");
    tenantIds = (data ?? []).filter((t) => !t.pause_drops_until || t.pause_drops_until < today).map((t) => t.id);
  }

  const results = [];
  for (const tenantId of tenantIds) {
    const dist = await distributeToTenant(tenantId, body.perTier ?? 5);
    if (body.sendEmails) await Promise.all(dist.assignmentIds.map((id) => sendWarmEmail(id)));
    results.push({ tenantId, assigned: dist.assigned, byTier: dist.byTier });
  }
  return NextResponse.json({ ok: true, tenants: results.length, results });
}
