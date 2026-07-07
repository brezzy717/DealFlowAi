import { NextRequest, NextResponse } from "next/server";

/**
 * Ava (Deal Assist) — broker's AI assistant.
 * Live Claude responses when ANTHROPIC_API_KEY is set; graceful demo answer otherwise.
 */

const SYSTEM = `You are Ava, the Deal Assist AI inside DealFlow AI — a platform that finds off-market
business-sale leads for business brokers. You help the broker understand their leads and metrics,
draft emails, prep for meetings, calculate commissions, and plan their day. Be concise, warm, and
concrete. When discussing a lead, reason from its signals (succession risk, life events, financial
distress, listing intent) and suggest the matching outreach playbook. Today's context: the broker is
on the Tier 2 plan, has 48 active prospects (10 Platinum), 6 appointments this week, and $413K YTD
commissions.`;

export async function POST(req: NextRequest) {
  const { messages } = (await req.json()) as { messages: { role: "user" | "assistant"; content: string }[] };

  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return NextResponse.json({
      reply:
        "I'm Ava — I'm running in demo mode because no ANTHROPIC_API_KEY is configured yet. " +
        "Once it's set in the environment, I can break down your metrics, draft owner emails, " +
        "reschedule meetings, calculate commissions, and run deep-dive reports on your weekly drops. " +
        "Add the key and ask me again!",
      demo: true,
    });
  }

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: SYSTEM,
      messages,
    }),
  });

  if (!res.ok) {
    return NextResponse.json({ reply: "I hit a snag talking to my brain — try again in a moment.", error: await res.text() }, { status: 502 });
  }
  const data = await res.json();
  const reply = data.content?.map((b: { type: string; text?: string }) => (b.type === "text" ? b.text : "")).join("") ?? "";
  return NextResponse.json({ reply });
}
