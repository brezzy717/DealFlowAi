import { notFound } from "next/navigation";
import { Zap, ShieldCheck } from "lucide-react";
import { supabaseAdmin, adminConfigured } from "@/lib/supabase/admin";
import { computeSlots, AvailabilityWindow } from "@/lib/scheduling";
import { BookingPicker } from "./booking-picker";

export const dynamic = "force-dynamic";

export default async function BookPage({ params }: { params: Promise<{ tenant: string }> }) {
  const { tenant: tenantId } = await params;
  if (!adminConfigured()) notFound();

  const admin = supabaseAdmin();
  const { data: tenant } = await admin.from("tenants").select("id, company_name").eq("id", tenantId).maybeSingle();
  if (!tenant) notFound();

  const [{ data: windows }, { data: taken }] = await Promise.all([
    admin.from("broker_availability").select("weekday, start_minute, end_minute").eq("tenant_id", tenantId),
    admin
      .from("appointments")
      .select("starts_at")
      .eq("tenant_id", tenantId)
      .neq("status", "cancelled")
      .gte("starts_at", new Date().toISOString()),
  ]);

  const slots = computeSlots(
    (windows as AvailabilityWindow[]) ?? [],
    new Set((taken ?? []).map((t) => new Date(t.starts_at).toISOString())),
  );

  return (
    <div className="mx-auto max-w-xl px-6 py-10">
      <div className="mb-6 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft ring-1 ring-accent/40">
          <Zap className="h-4.5 w-4.5 text-accent-bright" />
        </span>
        <span className="text-[14px] text-ink-dim">Scheduling for</span>
        <span className="text-[15px] font-semibold">{tenant.company_name}</span>
      </div>

      <div className="card p-6">
        <h1 className="font-display text-3xl font-medium">Book a confidential valuation call</h1>
        <p className="mt-1.5 flex items-center gap-1.5 text-[12px] text-ink-faint">
          <ShieldCheck className="h-3.5 w-3.5 text-teal" /> 30 minutes · no obligation · completely confidential · Arizona time
        </p>
        <div className="mt-6">
          {slots.length ? (
            <BookingPicker tenantId={tenant.id} slots={slots} />
          ) : (
            <p className="py-8 text-center text-[13px] text-ink-dim">
              No open times in the next two weeks — please reply to the email that brought you here.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
