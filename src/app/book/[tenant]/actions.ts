"use server";

import { supabaseAdmin, adminConfigured } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/outreach/adapters";

export interface BookingInput {
  tenantId: string;
  iso: string;
  name: string;
  email: string;
  phone: string;
  company: string;
}

export async function bookSlot(input: BookingInput): Promise<{ ok: boolean; error?: string; emailSent?: boolean }> {
  if (!adminConfigured()) return { ok: false, error: "Booking is not configured yet." };
  if (!input.name.trim() || !/.+@.+\..+/.test(input.email)) {
    return { ok: false, error: "Please provide your name and a valid email." };
  }

  const admin = supabaseAdmin();

  // Slot still free? (unique-ish guard; race window acceptable for v1)
  const { data: clash } = await admin
    .from("appointments")
    .select("id")
    .eq("tenant_id", input.tenantId)
    .eq("starts_at", input.iso)
    .neq("status", "cancelled")
    .maybeSingle();
  if (clash) return { ok: false, error: "That time was just taken — please pick another slot." };

  const { error } = await admin.from("appointments").insert({
    tenant_id: input.tenantId,
    starts_at: input.iso,
    kind: "discovery_call",
    source: "magic_link",
    status: "confirmed",
    guest_name: input.name.trim(),
    guest_email: input.email.trim(),
    guest_phone: input.phone.trim() || null,
    guest_company: input.company.trim() || null,
  });
  if (error) return { ok: false, error: error.message };

  // Confirmations — best-effort; the booking stands even if email fails
  const [{ data: tenant }, { data: broker }] = await Promise.all([
    admin.from("tenants").select("company_name").eq("id", input.tenantId).single(),
    admin.from("tenant_users").select("email, full_name").eq("tenant_id", input.tenantId).limit(1).maybeSingle(),
  ]);
  const when = new Date(input.iso).toLocaleString("en-US", {
    weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit",
    timeZone: "America/Phoenix", timeZoneName: "short",
  });
  const html = (who: "guest" | "broker") => `
<div style="font-family:Georgia,serif;max-width:540px;margin:0 auto;color:#222;line-height:1.6">
  <h2 style="font-weight:600">Appointment confirmed</h2>
  <p>${who === "guest"
    ? `Your confidential valuation call with <strong>${tenant?.company_name ?? "your broker"}</strong> is booked.`
    : `${input.name}${input.company ? ` (${input.company})` : ""} just booked a call with you.`}</p>
  <p style="font-size:18px"><strong>${when}</strong></p>
  ${who === "broker" ? `<p>Contact: ${input.email}${input.phone ? ` · ${input.phone}` : ""}</p>` : ""}
  <p style="font-size:12px;color:#888">A reminder will be sent the day before. Need to reschedule? Just reply to this email.</p>
</div>`;

  const results = await Promise.all([
    sendEmail(input.email, `Confirmed: your call on ${when}`, html("guest")),
    broker?.email ? sendEmail(broker.email, `New booking: ${input.name} — ${when}`, html("broker")) : Promise.resolve({ ok: false as const, reason: "not_configured" as const }),
  ]);

  return { ok: true, emailSent: results.some((r) => r.ok) };
}
