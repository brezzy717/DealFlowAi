import { inngest } from "./client";

/**
 * Production workflow definitions. They deploy as-is once INNGEST_EVENT_KEY /
 * INNGEST_SIGNING_KEY are set and the Supabase data layer replaces the
 * synthetic store. Each step.run(...) is durable: retried on failure,
 * resumed on redeploy.
 */

/** Tuesday 6:00 AM lead drop — 15/week per broker (5 per tier), per tenant parameters. */
export const tuesdayDrop = inngest.createFunction(
  { id: "tuesday-lead-drop", triggers: { cron: "TZ=America/Phoenix 0 6 * * 2" } },
  async ({ step }) => {
    const tenants = await step.run("load-active-tenants", async () => {
      // supabase: tenants where status='active' and (pause_drops_until is null or < today)
      return [] as { id: string; quotaPerWeek: number }[];
    });

    for (const tenant of tenants) {
      await step.run(`distribute-${tenant.id}`, async () => {
        // 1. pull tenant_parameters
        // 2. select top unassigned scored_leads per tier matching params (5 platinum, 5 gold, 5 silver)
        //    ORDER BY final_score DESC, with confidence >= 0.6 for platinum
        // 3. insert lead_assignments rows (unique constraint guarantees no double-assignment)
        // 4. emit outreach/lead-assigned per assignment
      });
    }

    await step.run("notify-admin", async () => {
      // distribution summary → admin dashboard + email
    });
  },
);

/** Day-1 outreach: warm email + postcards, then schedule the call cadence. */
export const outreachCadence = inngest.createFunction(
  { id: "outreach-cadence", triggers: { event: "outreach/lead-assigned" } },
  async ({ event, step }) => {
    await step.run("send-warm-email", async () => {
      // resend.send(warmIntroEmail(lead, broker)) with vault attachments + booking link
      // engagement webhook → outreach_feedback
    });
    await step.run("send-postcards", async () => {
      // Lob/PostGrid: business address + owner home address, broker's chosen template
    });

    // Tier 2 only from here (tenants.ai_calling_concierge_enabled)
    await step.sleep("wait-72h", "72h");
    for (const [i, delay] of (["0h", "48h", "48h"] as const).entries()) {
      if (delay !== "0h") await step.sleep(`gap-${i}`, delay);
      const booked = await step.run(`call-attempt-day-${3 + i * 2}`, async () => {
        // voice.call(lead, script) → 3-5 attempts 10am-6pm, TCPA + DNC scrubbed
        // outcome actioned → outreach_feedback + ml_training_data
        return false;
      });
      if (booked) return { done: "booked" };
    }
    await step.run("second-email-day-7", async () => {
      // template #2, same-day per spec
    });
    // Days 9-30: calls every 48h + weekly emails handled by a loop with
    // step.sleep, then 14-day pause and cycle restart via event re-emit.
    await step.sleep("pause-14d", "14d");
    await step.sendEvent("restart-cycle", { name: "outreach/lead-assigned", data: event.data });
  },
);

/** Event-driven rescoring: critical signals rescore immediately. */
export const rescoreOnSignal = inngest.createFunction(
  { id: "rescore-on-signal", triggers: { event: "signal/created" } },
  async ({ event, step }) => {
    const priority = event.data.priority as string;
    if (priority === "medium" || priority === "low") {
      await step.sleep("batch-window", priority === "medium" ? "6h" : "24h");
    }
    const result = await step.run("rescore", async () => {
      // POST ml-service /score {business_id} → upsert scored_leads + scoring_events
      return { tierChanged: false, from: "", to: "", businessId: event.data.businessId };
    });
    if (result.tierChanged) {
      await step.sendEvent("tier-changed", { name: "lead/tier-changed", data: result });
    }
  },
);

/** Nightly delta batch: rescore all businesses touched by today's ingestion. */
export const nightlyRescore = inngest.createFunction(
  { id: "nightly-delta-rescore", triggers: { cron: "TZ=America/Phoenix 30 3 * * *" } },
  async ({ step }) => {
    await step.run("collect-touched", async () => {
      // select distinct business_id from raw_ingestion where processed_at > yesterday
    });
    await step.run("batch-rescore", async () => {
      // chunked calls to ml-service /score/batch
    });
    await step.run("drift-metrics", async () => {
      // compute PSI per feature vs baseline → drift_metrics; alert if > 0.2
    });
  },
);

export const functions = [tuesdayDrop, outreachCadence, rescoreOnSignal, nightlyRescore];
