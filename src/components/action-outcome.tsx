"use client";

import { useState } from "react";
import { Check } from "lucide-react";

const OUTCOMES: { key: string; label: string; needsReason?: boolean }[] = [
  { key: "booked", label: "Booked" },
  { key: "future_interest", label: "Callback later", needsReason: true },
  { key: "no_answer", label: "No answer" },
  { key: "not_interested", label: "Not interested", needsReason: true },
  { key: "dnc", label: "Do not contact" },
];

export function ActionOutcome({ assignmentId }: { assignmentId?: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (outcome: string) => {
    setPending(outcome);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, outcome, reason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "failed");
      setDone(outcome);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not log outcome");
    } finally {
      setPending(null);
    }
  };

  if (!assignmentId) {
    return (
      <button
        disabled
        title="Available on live assignments (sign in + onboard)"
        className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] text-ink-faint opacity-60"
      >
        Action Outreach
      </button>
    );
  }

  if (done) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-md bg-teal-soft px-3 py-1.5 text-[12px] font-medium text-teal ring-1 ring-teal/30">
        <Check className="h-3.5 w-3.5" /> Logged: {done.replace(/_/g, " ")} — fed to the model
      </span>
    );
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded-md border border-accent/40 bg-accent-soft px-3 py-1.5 text-[12px] font-medium text-accent-bright hover:bg-accent/20"
      >
        Action Outreach
      </button>
    );
  }

  const activeReason = OUTCOMES.find((o) => o.needsReason);

  return (
    <div className="w-full space-y-2 rounded-lg border border-border bg-surface p-3">
      <p className="text-[11px] uppercase tracking-wider text-ink-faint">Log outcome (trains the model)</p>
      <div className="flex flex-wrap gap-1.5">
        {OUTCOMES.map((o) => (
          <button
            key={o.key}
            onClick={() => submit(o.key)}
            disabled={pending !== null}
            className="rounded-md border border-border bg-card px-2.5 py-1 text-[12px] text-ink-dim hover:border-accent/40 hover:text-ink disabled:opacity-50"
          >
            {pending === o.key ? "…" : o.label}
          </button>
        ))}
      </div>
      {activeReason ? (
        <input
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Reason (for callback / not interested)…"
          className="w-full rounded-md border border-border bg-card px-2.5 py-1.5 text-[12px] outline-none placeholder:text-ink-faint focus:border-accent/50"
        />
      ) : null}
      {error ? <p className="text-[11px] text-danger">{error}</p> : null}
    </div>
  );
}
