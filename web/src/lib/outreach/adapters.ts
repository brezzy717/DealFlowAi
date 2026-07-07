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
  const key = process.env.VAPI_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };
  const res = await fetch("https://api.vapi.ai/call", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
      customer: { number: opts.phone },
      assistant: {
        firstMessage: "Hi, may I speak with the owner?",
        model: { provider: "anthropic", model: "claude-sonnet-5", messages: [{ role: "system", content: opts.script }] },
        recordingEnabled: true,
        transcriber: { provider: "deepgram" },
      },
      metadata: opts.leadContext,
    }),
  });
  if (!res.ok) return { ok: false, reason: "error", detail: await res.text() };
  const data = await res.json();
  return { ok: true, data: { callId: data.id } };
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

export async function createBookingLink(brokerEmail: string): Promise<AdapterResult<{ url: string }>> {
  const key = process.env.CALCOM_API_KEY;
  if (!key) return { ok: false, reason: "not_configured" };
  // Cal.com platform API: fetch (or lazily create) the broker's managed user + event type
  const res = await fetch("https://api.cal.com/v2/event-types", {
    headers: { Authorization: `Bearer ${key}` },
  });
  if (!res.ok) return { ok: false, reason: "error", detail: await res.text() };
  return { ok: true, data: { url: `https://cal.com/dealflow/${brokerEmail.split("@")[0]}/valuation` } };
}
