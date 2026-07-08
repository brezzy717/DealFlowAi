import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Meta Model (spec Part 6): downstream LLM that turns the ensemble/rules
 * output into the natural-language explanation brokers see. Runs at
 * disbursement time on the leads being dropped (not the whole pool), so cost
 * scales with drops. Falls back silently to the rules-engine template
 * explanation when no ANTHROPIC_API_KEY is present.
 *
 * PROPRIETARY GUARD: the prompt forbids mentioning scores, weights,
 * algorithms, or data-source names — brokers must never see scoring internals.
 */

interface LeadPayload {
  tier: string;
  saleWindow: string;
  sourceTags?: string[];
  explanation: string;
  business?: {
    name?: string;
    industry?: string;
    city?: string;
    state?: string;
    owner?: { name?: string; age?: number; yearsOwnership?: number };
  };
  topSignals?: { detail: string }[];
}

async function generateExplanation(p: LeadPayload): Promise<string | null> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return null;

  const prompt = `You are a senior M&A analyst at DealFlow AI explaining to a business broker why a specific
business owner is likely to sell soon.

BUSINESS: ${p.business?.name} (${p.business?.industry}, ${p.business?.city}, ${p.business?.state})
OWNER: ${p.business?.owner?.name}, ${p.business?.owner?.age} years old, ${p.business?.owner?.yearsOwnership} years running it
LEAD CLASS: ${p.tier.toUpperCase()} — estimated sale window ${p.saleWindow}
LEAD TYPE TAGS: ${p.sourceTags?.join(", ") || "standard"}
OBSERVED SIGNALS:
${(p.topSignals ?? []).map((s) => `- ${s.detail}`).join("\n")}

Write a 2-3 sentence explanation for the broker about why this owner is likely to sell within the indicated
window, and end with one concrete suggestion for the first outreach angle. Be specific about the most compelling
signals. HARD RULES: never mention scores, points, weights, algorithms, models, tiers, or where the data came
from — speak naturally about the business situation only. If the tags include "estate", the owner is deceased:
address the beneficiaries situation with sensitivity. If tags include "stale_listing", the business is already
listed with a competing broker — emphasize the switch pitch.`;

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "x-api-key": key, "anthropic-version": "2023-06-01", "content-type": "application/json" },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 300,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const text = data.content?.map((b: { type: string; text?: string }) => (b.type === "text" ? b.text : "")).join("").trim();
    return text || null;
  } catch {
    return null;
  }
}

/** Regenerate explanations for a set of scored leads (called at disbursement). */
export async function applyMetaExplanations(scoredLeadIds: string[]): Promise<number> {
  if (!process.env.ANTHROPIC_API_KEY || !scoredLeadIds.length) return 0;
  const admin = supabaseAdmin();
  const { data: leads } = await admin.from("scored_leads").select("id, ui_payload").in("id", scoredLeadIds);
  if (!leads?.length) return 0;

  let updated = 0;
  await Promise.all(
    leads.map(async (l) => {
      const payload = l.ui_payload as (LeadPayload & Record<string, unknown>) | null;
      if (!payload) return;
      const text = await generateExplanation(payload);
      if (!text) return;
      await admin
        .from("scored_leads")
        .update({ llm_explanation: text, ui_payload: { ...payload, explanation: text } })
        .eq("id", l.id);
      updated++;
    }),
  );
  return updated;
}
