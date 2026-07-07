import { Inngest } from "inngest";

/**
 * Event catalog:
 *  - "signal/created"      {businessId, signalId, priority}  → rescore flows
 *  - "lead/tier-changed"   {businessId, from, to}            → pool/alerts
 *  - "drop/run"            (cron-invoked)                    → Tuesday distribution
 *  - "outreach/lead-assigned" {assignmentId, tenantId}       → cadence kickoff
 */
export const inngest = new Inngest({ id: "dealflow-ai" });
