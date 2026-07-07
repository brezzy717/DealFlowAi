"use client";

import { useMemo, useState } from "react";
import { Slot } from "@/lib/scheduling";
import { bookSlot } from "./actions";
import { CalendarCheck2, Check } from "lucide-react";

export function BookingPicker({ tenantId, slots }: { tenantId: string; slots: Slot[] }) {
  const days = useMemo(() => {
    const map = new Map<string, { label: string; slots: Slot[] }>();
    for (const s of slots) {
      if (!map.has(s.dayKey)) map.set(s.dayKey, { label: s.dayLabel, slots: [] });
      map.get(s.dayKey)!.slots.push(s);
    }
    return [...map.entries()].slice(0, 10);
  }, [slots]);

  const [dayKey, setDayKey] = useState(days[0]?.[0]);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!slot) return;
    setBusy(true);
    setError(null);
    const res = await bookSlot({ tenantId, iso: slot.iso, ...form });
    setBusy(false);
    if (!res.ok) {
      setError(res.error ?? "Something went wrong.");
      return;
    }
    setDone(true);
  };

  if (done) {
    return (
      <div className="py-10 text-center">
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-soft ring-1 ring-teal/40">
          <Check className="h-7 w-7 text-teal" />
        </span>
        <h2 className="mt-4 font-display text-3xl font-medium">You&apos;re booked</h2>
        <p className="mt-2 text-[13px] text-ink-dim">
          {slot?.dayLabel} at {slot?.label} (Arizona time). A confirmation email is on its way.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Day picker */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {days.map(([key, d]) => (
          <button
            key={key}
            onClick={() => { setDayKey(key); setSlot(null); }}
            className={`shrink-0 rounded-lg px-3.5 py-2 text-[13px] ring-1 transition ${
              key === dayKey ? "bg-accent-soft text-ink ring-accent/40" : "text-ink-dim ring-border hover:text-ink"
            }`}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Slot grid */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
        {days.find(([k]) => k === dayKey)?.[1].slots.map((s) => (
          <button
            key={s.iso}
            onClick={() => setSlot(s)}
            className={`rounded-lg py-2 text-[13px] ring-1 transition ${
              slot?.iso === s.iso ? "bg-accent text-white ring-accent" : "text-ink-dim ring-border hover:text-ink hover:ring-accent/40"
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Contact form */}
      {slot ? (
        <div className="space-y-3 border-t border-border pt-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Your name *"
              className="rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px] outline-none placeholder:text-ink-faint focus:border-accent/50" />
            <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email *" type="email"
              className="rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px] outline-none placeholder:text-ink-faint focus:border-accent/50" />
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone"
              className="rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px] outline-none placeholder:text-ink-faint focus:border-accent/50" />
            <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Business name"
              className="rounded-lg border border-border bg-surface px-3 py-2.5 text-[13px] outline-none placeholder:text-ink-faint focus:border-accent/50" />
          </div>
          {error ? <p className="text-[12px] text-danger">{error}</p> : null}
          <button
            onClick={submit}
            disabled={busy || !form.name || !form.email}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent py-3 text-[14px] font-medium text-white hover:bg-accent-bright disabled:opacity-50"
          >
            <CalendarCheck2 className="h-4 w-4" />
            {busy ? "Booking…" : `Confirm ${slot.dayLabel} · ${slot.label}`}
          </button>
        </div>
      ) : null}
    </div>
  );
}
