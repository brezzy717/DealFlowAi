import { generateBusinesses } from "@/lib/data/synthetic";
import { scoreBusiness } from "@/lib/scoring/engine";
import { LeadStatus, ScoredLead, Tier } from "@/lib/types";

/**
 * Phase 1 in-memory store. Mirrors what Supabase will serve in Phase 2 —
 * every accessor here maps 1:1 to a future query against scored_leads.
 */

const NOW = new Date("2026-07-06T06:00:00Z");

let cache: ScoredLead[] | null = null;

const STATUS_ROTATION: LeadStatus[] = [
  "needs_action", "contacted", "new", "meeting_scheduled", "contacted", "needs_action", "in_pipeline", "new",
];

export function getScoredLeads(): ScoredLead[] {
  if (cache) return cache;
  const businesses = generateBusinesses(240, 20260706, NOW);
  const scored = businesses.map((b) => scoreBusiness(b, NOW));

  // Simulate the broker's book: distributed leads are the non-Black ones,
  // spread over the last 4 weekly Tuesday drops (5 per tier per week).
  const byTier: Record<Tier, typeof scored> = { platinum: [], gold: [], silver: [], black: [] };
  for (const s of scored) byTier[s.tier].push(s);
  (Object.keys(byTier) as Tier[]).forEach((t) => byTier[t].sort((a, z) => z.score - a.score));

  const leads: ScoredLead[] = [];
  let statusIdx = 0;
  for (const tier of ["platinum", "gold", "silver"] as Tier[]) {
    byTier[tier].forEach((s, i) => {
      const dropWeeksAgo = Math.floor(i / 5); // 5 per tier per weekly drop
      if (dropWeeksAgo > 3) return; // only 4 weeks of history in the demo book
      leads.push({
        ...s,
        status: dropWeeksAgo === 0 ? "new" : STATUS_ROTATION[statusIdx++ % STATUS_ROTATION.length],
        dropWeeksAgo,
      });
    });
  }
  // Black tier: monitored pool, never distributed — kept for the admin view later.
  for (const s of byTier.black.slice(0, 40)) {
    leads.push({ ...s, status: "new", dropWeeksAgo: -1 });
  }

  cache = leads;
  return leads;
}

export function getBrokerBook(): ScoredLead[] {
  return getScoredLeads().filter((l) => l.dropWeeksAgo >= 0);
}

export function getLatestDrop(): ScoredLead[] {
  return getBrokerBook()
    .filter((l) => l.dropWeeksAgo === 0)
    .sort((a, z) => z.score - a.score);
}

export function getNeedsAction(): ScoredLead[] {
  return getBrokerBook().filter((l) => l.status === "needs_action");
}

export function getTierCounts(): Record<Tier, number> {
  const counts: Record<Tier, number> = { platinum: 0, gold: 0, silver: 0, black: 0 };
  for (const l of getBrokerBook()) counts[l.tier]++;
  return counts;
}

export interface Appointment {
  id: string;
  leadName: string;
  ownerName: string;
  when: string; // ISO
  kind: "discovery_call" | "valuation_presentation" | "listing_agreement";
  source: "ai_concierge" | "magic_link" | "broker";
}

export function getUpcomingAppointments(): Appointment[] {
  const book = getBrokerBook().filter((l) => l.status === "meeting_scheduled").slice(0, 6);
  const kinds: Appointment["kind"][] = ["discovery_call", "valuation_presentation", "discovery_call", "listing_agreement"];
  const sources: Appointment["source"][] = ["ai_concierge", "magic_link", "broker"];
  return book.map((l, i) => {
    const d = new Date(NOW);
    d.setDate(d.getDate() + 1 + i * 2);
    d.setHours(9 + (i % 4) * 2, i % 2 === 0 ? 0 : 30, 0, 0);
    return {
      id: `appt_${l.business.id}`,
      leadName: l.business.name,
      ownerName: l.business.owner.name,
      when: d.toISOString(),
      kind: kinds[i % kinds.length],
      source: sources[i % sources.length],
    };
  });
}

export const DEMO_KPIS = {
  ytdCommissions: 412_500,
  pipelineValue: 7_850_000,
  bookedThisMonth: 11,
  closeRate: 0.34,
  dealsClosedYtd: 9,
  avgDaysToClose: 74,
  nextDropDate: "2026-07-07T06:00:00-07:00", // Tuesday 6am
};

export function getAvgScoreLatestDrop(): number {
  const drop = getLatestDrop();
  if (!drop.length) return 0;
  return Math.round(drop.reduce((a, l) => a + l.score, 0) / drop.length);
}

export function getHotLeadCount(): number {
  return getBrokerBook().filter((l) => l.tier === "platinum" && l.status !== "in_pipeline").length;
}
