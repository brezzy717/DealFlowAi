/**
 * Thin adapters over external services. Each activates when its env var is
 * present; otherwise the caller gets a typed "not configured" result so demo
 * mode never crashes and Phase-2 wiring is a key-paste, not a refactor.
 */

type AdapterResult<T> = { ok: true; data: T } | { ok: false; reason: "not_configured" | "error"; detail?: string };

export async function sendEmail(to: string, subject: string, html: string): Promise<AdapterResult<{ id: string }>> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.OUTREACH_FROM ?? "outreach@dealflow.ai", to, subject, html }),
  });
  if (!res.ok) return { ok: false, reason: "error", detail: await res.text() };
  return { ok: true, data: await res.json() };
}

export async function startOutboundCall(opts: {
  phone: string;
  script: string;
  leadContext: Record<string, string>;
}): Promise<AdapterResult<{ callId: string }>> {
  const key = process.env.RETELL_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };
  // Requires a Retell agent + purchased number configured in the Retell
  // dashboard (RETELL_AGENT_ID / RETELL_FROM_NUMBER). The agent prompt reads
  // dynamic variables filled from the lead context + broker script.
  const res = await fetch("https://api.retellai.com/v2/create-phone-call", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from_number: process.env.RETELL_FROM_NUMBER,
      to_number: opts.phone,
      override_agent_id: process.env.RETELL_AGENT_ID,
      retell_llm_dynamic_variables: { ...opts.leadContext, broker_script: opts.script },
      metadata: opts.leadContext,
    }),
  });
  if (!res.ok) return { ok: false, reason: "error", detail: await res.text() };
  const data = await res.json();
  return { ok: true, data: { callId: data.call_id } };
}

export async function sendPostcard(opts: {
  toName: string;
  address: { line1: string; city: string; state: string; zip: string };
  templateId: string;
  qrUrl: string;
}): Promise<AdapterResult<{ id: string }>> {
  const key = process.env.LOB_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };
  const res = await fetch("https://api.lob.com/v1/postcards", {
    method: "POST",
    headers: { Authorization: `Basic ${Buffer.from(key + ":").toString("base64")}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      to: { name: opts.toName, address_line1: opts.address.line1, address_city: opts.address.city, address_state: opts.address.state, address_zip: opts.address.zip },
      front: opts.templateId,
      back: `<html><body>Scan to book a confidential valuation: <img src="{{qr '${opts.qrUrl}'}}" /></body></html>`,
      size: "4x6",
    }),
  });
  if (!res.ok) return { ok: false, reason: "error", detail: await res.text() };
  return { ok: true, data: await res.json() };
}

/** Native scheduling: every tenant gets /book/<tenantId> — no third-party service. */
export function bookingLinkFor(tenantId: string): string {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? "https://dealflow.ai";
  return `${base}/book/${tenantId}`;
}
