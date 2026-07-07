import { getBrokerBook } from "@/lib/data/store";

/**
 * Phase 1b synthetic CRM entities, derived deterministically from the scored
 * book. Each accessor maps 1:1 to a future Supabase query (see
 * supabase/migrations/0001_init.sql).
 */

export const PIPELINE_STAGES = [
  "Representation Signed",
  "Valuation & Packaging",
  "Confidential Marketing",
  "Buyer Offers / LOI",
  "Due Diligence",
  "Contract & Escrow",
  "Funded & Closed",
] as const;
export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export interface Deal {
  id: string;
  business: string;
  ownerName: string;
  industry: string;
  city: string;
  estValue: number;
  commissionPct: number;
  stage: PipelineStage;
  daysInStage: number;
  tier: string;
}

export interface Client {
  id: string;
  name: string;
  business: string;
  email: string;
  phone: string;
  source: "converted" | "imported";
  since: string;
  status: "active_deal" | "closed" | "nurture";
}

export interface TaskItem {
  id: string;
  title: string;
  kind: "action_outreach" | "document" | "reminder" | "todo";
  due: string;
  done: boolean;
  ref?: string;
}

export interface VaultDoc {
  id: string;
  name: string;
  type: string;
  sizeKb: number;
  updatedAt: string;
  builtin: boolean;
  attachedToOutreach: boolean;
}

export interface CallLog {
  id: string;
  leadName: string;
  ownerName: string;
  when: string;
  durationSec: number;
  attempt: number;
  outcome: "booked" | "no_answer" | "not_interested" | "dnc" | "future_interest" | "pending_action";
  transcriptSnippet: string;
}

export interface Tenant {
  id: string;
  broker: string;
  company: string;
  email: string;
  tier: 1 | 2;
  status: "active" | "past_due" | "churned";
  leadsAssigned: number;
  contactedPct: number;
  mrr: number;
  joined: string;
  lastActive: string;
}

const seededPick = <T,>(arr: T[], i: number): T => arr[i % arr.length];

export function getDeals(): Deal[] {
  const inPipeline = getBrokerBook().filter((l) => l.status === "in_pipeline" || l.status === "meeting_scheduled");
  const stages: PipelineStage[] = [
    "Representation Signed", "Valuation & Packaging", "Confidential Marketing",
    "Buyer Offers / LOI", "Due Diligence", "Contract & Escrow", "Representation Signed",
    "Valuation & Packaging", "Funded & Closed",
  ];
  return inPipeline.slice(0, 12).map((l, i) => ({
    id: `deal_${l.business.id}`,
    business: l.business.name,
    ownerName: l.business.owner.name,
    industry: l.business.industry,
    city: `${l.business.city}, ${l.business.state}`,
    estValue: Math.round((l.business.revenueEstimate * (0.4 + (i % 5) * 0.12)) / 10000) * 10000,
    commissionPct: 10,
    stage: seededPick(stages, i),
    daysInStage: 3 + ((i * 7) % 34),
    tier: l.tier,
  }));
}

export function getClients(): Client[] {
  const deals = getDeals();
  const converted: Client[] = deals.map((d, i) => ({
    id: `client_${d.id}`,
    name: d.ownerName,
    business: d.business,
    email: `${d.ownerName.toLowerCase().replace(/[^a-z]+/g, ".")}@${d.business.toLowerCase().replace(/[^a-z]+/g, "")}.com`,
    phone: `(602) 555-0${140 + i}`,
    source: "converted",
    since: new Date(Date.UTC(2026, 2 + (i % 4), 3 + i)).toISOString(),
    status: d.stage === "Funded & Closed" ? "closed" : "active_deal",
  }));
  const imported: Client[] = [
    { id: "imp_1", name: "Harold Jenkins", business: "Jenkins Fabrication", email: "harold@jenkinsfab.com", phone: "(480) 555-0101", source: "imported", since: "2026-01-12T00:00:00Z", status: "nurture" },
    { id: "imp_2", name: "Maria Delacruz", business: "Delacruz Catering Group", email: "maria@delacruzcatering.com", phone: "(602) 555-0112", source: "imported", since: "2026-01-12T00:00:00Z", status: "nurture" },
    { id: "imp_3", name: "Sam Whitaker", business: "Whitaker Pool Service", email: "sam@whitakerpools.com", phone: "(623) 555-0177", source: "imported", since: "2026-02-02T00:00:00Z", status: "nurture" },
  ];
  return [...converted, ...imported];
}

export function getTasks(): TaskItem[] {
  const needsAction = getBrokerBook().filter((l) => l.status === "needs_action").slice(0, 6);
  const auto: TaskItem[] = needsAction.map((l, i) => ({
    id: `task_action_${l.business.id}`,
    title: `Action outreach outcome — ${l.business.name}`,
    kind: "action_outreach",
    due: new Date(Date.UTC(2026, 6, 7 + (i % 3))).toISOString(),
    done: false,
    ref: l.business.id,
  }));
  const manual: TaskItem[] = [
    { id: "t_doc1", title: "Send NDA to Canyon Property Partners", kind: "document", due: "2026-07-08T00:00:00Z", done: false },
    { id: "t_rem1", title: "Site visit — Desert Electric warehouse", kind: "reminder", due: "2026-07-09T00:00:00Z", done: false },
    { id: "t_todo1", title: "Prep valuation deck for Friday meeting", kind: "todo", due: "2026-07-10T00:00:00Z", done: false },
    { id: "t_todo2", title: "Follow up with escrow on Summit deal", kind: "todo", due: "2026-07-07T00:00:00Z", done: true },
  ];
  return [...auto, ...manual];
}

export function getVaultDocs(): VaultDoc[] {
  return [
    { id: "v1", name: "Exit-Ready: The Owner's Guide (eBook)", type: "PDF", sizeKb: 4200, updatedAt: "2026-06-20", builtin: true, attachedToOutreach: true },
    { id: "v2", name: "Business Sale Readiness Checklist", type: "PDF", sizeKb: 380, updatedAt: "2026-06-20", builtin: true, attachedToOutreach: true },
    { id: "v3", name: "Broker Representation Agreement (template)", type: "PDF", sizeKb: 610, updatedAt: "2026-05-30", builtin: true, attachedToOutreach: false },
    { id: "v4", name: "Mutual NDA (sample)", type: "PDF", sizeKb: 240, updatedAt: "2026-05-30", builtin: true, attachedToOutreach: false },
    { id: "v5", name: "Letter of Intent (sample)", type: "PDF", sizeKb: 310, updatedAt: "2026-05-30", builtin: true, attachedToOutreach: false },
    { id: "v6", name: "Confidential Marketing Copy (ad templates)", type: "DOCX", sizeKb: 150, updatedAt: "2026-06-02", builtin: true, attachedToOutreach: false },
  ];
}

export function getCallLogs(): CallLog[] {
  const t2 = getBrokerBook().filter((l) => l.dropWeeksAgo <= 1).slice(0, 8);
  const outcomes: CallLog["outcome"][] = ["booked", "no_answer", "future_interest", "no_answer", "not_interested", "pending_action", "no_answer", "booked"];
  const snippets: Record<CallLog["outcome"], string> = {
    booked: "…that works, let's do Thursday at 10. — Great, you'll get a confirmation email shortly…",
    no_answer: "Voicemail reached. Left callback message per script v2.",
    not_interested: "…we're doing fine, not looking to sell right now… — Understood, I'll note that…",
    dnc: "…take me off your list… — Absolutely, you won't be contacted again.",
    future_interest: "…call me back after the summer, we might be ready then… — Noted for September.",
    pending_action: "Call completed — outcome not yet actioned by broker.",
  };
  return t2.map((l, i) => ({
    id: `call_${l.business.id}_${i}`,
    leadName: l.business.name,
    ownerName: l.business.owner.name,
    when: new Date(Date.UTC(2026, 6, 6, 17 + (i % 5), (i * 13) % 60)).toISOString(),
    durationSec: l && outcomes[i] === "no_answer" ? 32 : 190 + ((i * 47) % 400),
    attempt: 1 + (i % 3),
    outcome: outcomes[i],
    transcriptSnippet: snippets[outcomes[i]],
  }));
}

export function getTenants(): Tenant[] {
  const names = [
    ["Steve Marlowe", "Marlowe Business Advisors"], ["Dana Okafor", "Okafor M&A Group"],
    ["Rick Vasquez", "Sunbelt Partners PHX"], ["Joan Petrides", "Petrides Brokerage"],
    ["Marcus Lee", "Lee & Associates BB"], ["Tina Rousseau", "Rousseau Exit Advisory"],
    ["Bill Hartman", "Hartman Deal Co."], ["Aisha Grant", "Grant Business Sales"],
  ] as const;
  const tiers: (1 | 2)[] = [2, 2, 1, 2, 1, 2, 1, 2];
  const status: Tenant["status"][] = ["active", "active", "active", "active", "past_due", "active", "churned", "active"];
  return names.map(([broker, company], i) => ({
    id: `tenant_${i + 1}`,
    broker,
    company,
    email: `${broker.split(" ")[0].toLowerCase()}@${company.toLowerCase().replace(/[^a-z]+/g, "")}.com`,
    tier: tiers[i],
    status: status[i],
    leadsAssigned: status[i] === "churned" ? 180 : 60 + i * 15,
    contactedPct: [92, 88, 61, 95, 40, 84, 12, 79][i],
    mrr: tiers[i] === 2 ? 5500 : 2400,
    joined: new Date(Date.UTC(2026, i % 6, 4 + i)).toISOString(),
    lastActive: status[i] === "churned" ? "2026-05-28T00:00:00Z" : `2026-07-0${6 - (i % 3)}T00:00:00Z`,
  }));
}

export const ADMIN_KPIS = {
  activeTenants: 6,
  mrr: 6 * 4000 + 1500,
  leadsDistributedThisWeek: 90,
  poolPlatinum: 1240,
  poolGold: 8620,
  poolSilver: 31400,
  poolBlack: 37_900_000,
  modelPrecisionPlatinum: 0.71,
  rulesVsEnsembleDelta: "+4.2%",
};

export const SOURCE_FRESHNESS = [
  { source: "ATTOM Pre-Foreclosure (daily diff)", cadence: "daily", lastRun: "2026-07-07 02:10", status: "ok" },
  { source: "UniCourt sweep (owners, Silver+)", cadence: "nightly", lastRun: "2026-07-07 02:45", status: "ok" },
  { source: "Obituary / death-notice scrapers", cadence: "daily", lastRun: "2026-07-07 03:05", status: "ok" },
  { source: "Competitor listings (BizBuySell et al.)", cadence: "daily diff", lastRun: "2026-07-07 03:30", status: "ok" },
  { source: "Google Places snapshots (active book)", cadence: "weekly", lastRun: "2026-07-05 04:00", status: "ok" },
  { source: "PDL Employee Count by Month", cadence: "monthly", lastRun: "2026-07-01 01:00", status: "ok" },
  { source: "D&B scraper queue", cadence: "monthly rolling", lastRun: "2026-07-06 22:15", status: "degraded" },
  { source: "Social scrapers (FB/IG/LinkedIn)", cadence: "weekly", lastRun: "2026-06-29 05:00", status: "stale" },
] as const;
