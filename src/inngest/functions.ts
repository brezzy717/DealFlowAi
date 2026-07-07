import { inngest } from "./client";
import { supabaseAdmin, adminConfigured } from "@/lib/supabase/admin";
import { distributeToTenant, sendWarmEmail } from "@/lib/distribution";

/**
 * Live workflows against Supabase. Deploy via the Inngest Vercel integration
 * (syncs from /api/inngest). Each step.run is durable: retried on failure,
 * resumed on redeploy.
 */

/** Tuesday 6:00 AM lead drop — 5 per tier per active tenant, per their params. */
export const tuesdayDrop = inngest.createFunction(
  { id: "tuesday-lead-drop", triggers: { cron: "TZ=America/Phoenix 0 6 * * 2" } },
  async ({ step }) => {
    if (!adminConfigured()) return { skipped: "supabase not configured" };
    const admin = supabaseAdmin();

    const tenants = await step.run("load-active-tenants", async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await admin.from("tenants").select("id, pause_drops_until").eq("status", "active");
      return (data ?? []).filter((t) => !t.pause_drops_until || t.pause_drops_until < today).map((t) => t.id);
    });

    let total = 0;
    for (const tenantId of tenants) {
      const dist = await step.run(`distribute-${tenantId}`, async () => distributeToTenant(tenantId, 5));
      total += dist.assigned;
      await step.run(`warm-emails-${tenantId}`, async () => {
        await Promise.all(dist.assignmentIds.map((id) => sendWarmEmail(id)));
        return dist.assignmentIds.length;
      });
      for (const id of dist.assignmentIds) {
        await step.sendEvent(`cadence-${id}`, { name: "outreach/lead-assigned", data: { assignmentId: id, tenantId } });
      }
    }
    return { tenants: tenants.length, leadsDistributed: total };
  },
);

/** Day-1 email already sent at distribution; this runs the Tier-2 call cadence. */
export const outreachCadence = inngest.createFunction(
  { id: "outreach-cadence", triggers: { event: "outreach/lead-assigned" } },
  async ({ event, step }) => {
    if (!adminConfigured()) return { skipped: true };
    const admin = supabaseAdmin();
    const { assignmentId, tenantId } = event.data as { assignmentId: string; tenantId: string };

    const tier2 = await step.run("check-tier2", async () => {
      const { data } = await admin.from("tenants").select("ai_calling_concierge_enabled").eq("id", tenantId).maybeSingle();
      return Boolean(data?.ai_calling_concierge_enabled);
    });
    if (!tier2) return { done: "tier1 — email + postcard only" };

    // Day 3 / 5 / 7 call attempts (Retell). Stop early on a booking or DNC.
    await step.sleep("wait-72h", "72h");
    for (const [i, gap] of (["0h", "48h", "48h"] as const).entries()) {
      if (gap !== "0h") await step.sleep(`gap-${i}`, gap);
      const done = await step.run(`call-day-${3 + i * 2}`, async () => {
        const { data } = await admin.from("lead_assignments").select("status").eq("id", assignmentId).maybeSingle();
        return data?.status === "meeting_scheduled" || data?.status === "dnc";
        // else: voice.startOutboundCall(...) → outcome → outreach_feedback + ml_training_data
      });
      if (done) return { done: "resolved during calls" };
    }
    await step.run("second-email-day-7", async () => "followUpEmail via Resend");
    await step.sleep("pause-14d", "14d");
    await step.sendEvent("restart", { name: "outreach/lead-assigned", data: event.data });
  },
);

/** Event-driven rescoring: critical signals rescore immediately. */
export const rescoreOnSignal = inngest.createFunction(
  { id: "rescore-on-signal", triggers: { event: "signal/created" } },
  async ({ event, step }) => {
    const priority = (event.data as { priority?: string }).priority;
    if (priority === "medium") await step.sleep("batch-window", "6h");
    else if (priority === "low") await step.sleep("batch-window", "24h");
    await step.run("rescore", async () => {
      // ml-service /score → upsert scored_leads + scoring_events; emit lead/tier-changed on change
      return { ok: true };
    });
  },
);

/** Nightly delta batch + drift metrics. */
export const nightlyRescore = inngest.createFunction(
  { id: "nightly-delta-rescore", triggers: { cron: "TZ=America/Phoenix 30 3 * * *" } },
  async ({ step }) => {
    await step.run("collect-touched", async () => "todo: distinct business_id from today's raw_ingestion");
    await step.run("batch-rescore", async () => "todo: chunked ml-service /score/batch");
    await step.run("drift-metrics", async () => "todo: PSI per feature vs baseline → drift_metrics");
  },
);

export const functions = [tuesdayDrop, outreachCadence, rescoreOnSignal, nightlyRescore];
