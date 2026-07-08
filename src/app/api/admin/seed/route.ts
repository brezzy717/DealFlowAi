import { NextRequest, NextResponse } from "next/server";
import { generateBusinesses } from "@/lib/data/synthetic";
import { scoreBusiness } from "@/lib/scoring/engine";
import { supabaseAdmin, adminConfigured } from "@/lib/supabase/admin";

/**
 * Seeds the Supabase lead pool from the synthetic generator (Phase-4 bridge:
 * the real ingestion pipeline replaces this). Guarded by the service key —
 * call with: POST /api/admin/seed  Authorization: Bearer <SUPABASE_SECRET_KEY>
 */
export async function POST(req: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 503 });
  }
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY}`;
  if (process.env.NODE_ENV !== "development" && auth !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = supabaseAdmin();
  const now = new Date("2026-07-07T06:00:00Z");
  const businesses = generateBusinesses(240, 20260706, now);

  let inserted = 0;
  for (let i = 0; i < businesses.length; i += 50) {
    const chunk = businesses.slice(i, i + 50);

    const { data: bizRows, error: bizErr } = await admin
      .from("businesses")
      .upsert(
        chunk.map((b) => ({
          pdl_company_id: b.id, // synthetic id doubles as the match key
          legal_name: b.name,
          naics_code: b.naics,
          industry_category: b.industry,
          city: b.city,
          state: b.state,
          zip_code: b.zip,
          latitude: b.lat,
          longitude: b.lng,
          founded_date: `${b.foundedYear}-01-01`,
          employee_count: b.employeeCount,
          revenue_estimate: b.revenueEstimate,
          is_demo: true,
        })),
        { onConflict: "pdl_company_id" },
      )
      .select("id, pdl_company_id");
    if (bizErr) return NextResponse.json({ error: bizErr.message, at: "businesses" }, { status: 500 });

    const idMap = new Map(bizRows.map((r) => [r.pdl_company_id, r.id]));
    const scored = chunk.map((b) => ({ b, s: scoreBusiness(b, now) }));

    const { data: leadRows, error: leadErr } = await admin.from("scored_leads").upsert(
      scored.map(({ b, s }) => ({
        business_id: idMap.get(b.id),
        final_score: s.score,
        base_score: s.baseScore,
        stack_multiplier: s.stackMultiplier,
        interaction_bonus: Math.min(9, s.interactions.reduce((a, x) => a + x.points, 0)),
        interactions: s.interactions,
        confidence: s.confidence,
        tier: s.tier,
        needs_verification: s.confidenceFlag === "needs_verification",
        source_tags: s.sourceTags,
        predicted_sale_window: s.saleWindow,
        feature_vector: Object.fromEntries(s.allSignals.map((f) => [f.id, f.points])),
        top_signals: s.topSignals,
        llm_explanation: s.explanation,
        ui_payload: { ...s, scoredAt: now.toISOString() },
      })),
      { onConflict: "business_id" },
    ).select("id, business_id, final_score, tier");
    if (leadErr) return NextResponse.json({ error: leadErr.message, at: "scored_leads" }, { status: 500 });

    // Timestamp every scoring event (spec: audit trail of all scores)
    if (leadRows?.length) {
      await admin.from("scoring_events").insert(
        leadRows.map((r) => ({
          business_id: r.business_id,
          scored_lead_id: r.id,
          event_type: "initial_score",
          trigger_reason: "bulk_seed",
          new_score: r.final_score,
          new_tier: r.tier,
        })),
      );
    }
    inserted += chunk.length;
  }

  const { count } = await admin.from("scored_leads").select("id", { count: "exact", head: true });
  return NextResponse.json({ ok: true, seeded: inserted, totalScoredLeads: count });
}
