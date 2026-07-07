import { Topbar } from "@/components/topbar";
import { getCallLogs } from "@/lib/data/crm";
import { ScriptEditor } from "@/components/script-editor";
import { Mail, Phone, MailOpen, Send, PauseCircle, PlayCircle, Headphones, FileDown } from "lucide-react";

const OUTCOME_CLS: Record<string, string> = {
  booked: "bg-teal-soft text-teal ring-teal/30",
  no_answer: "bg-surface text-ink-dim ring-border",
  not_interested: "bg-warning/10 text-warning ring-warning/25",
  dnc: "bg-danger/10 text-danger ring-danger/25",
  future_interest: "bg-accent-soft text-accent-bright ring-accent/30",
  pending_action: "bg-danger/10 text-danger ring-danger/25",
};

const CADENCE = [
  { day: "Day 1 · 6:00 AM", what: "Warm intro email (vault attachments + AI video + booking link) AND USPS postcards to business + home address", icon: Mail },
  { day: "Day 3", what: "1st follow-up call — 3–5 attempts between 10 AM–6 PM, each attempt actioned for the feedback loop", icon: Phone },
  { day: "Day 5", what: "2nd follow-up call — same rules", icon: Phone },
  { day: "Day 7", what: "3rd follow-up call → if no contact, 2nd follow-up email sent same day", icon: MailOpen },
  { day: "Days 9–30", what: "Calls every 48h + weekly emails, running concurrently, until contact or Day 30", icon: Send },
  { day: "Day 30", what: "14-day pause", icon: PauseCircle },
  { day: "Day 44", what: "Full cycle repeats until booked or DNC (lead stays yours for life)", icon: PlayCircle },
] as const;

export default function ConciergePage() {
  const logs = getCallLogs();
  return (
    <>
      <Topbar
        title="Outreach Concierge"
        subtitle="Tier 2 automation: the full cadence engine, editable scripts, and every call recorded, transcribed, and actioned."
      />
      <main className="space-y-6 px-8 py-6">
        <div className="grid gap-6 xl:grid-cols-2">
          {/* Cadence timeline */}
          <section className="card p-5">
            <h2 className="font-display text-xl font-medium">Outreach Cadence</h2>
            <p className="mt-1 text-[12px] text-ink-faint">
              Runs automatically on every distributed lead · voice agent + email + direct mail
            </p>
            <ol className="mt-4 space-y-0">
              {CADENCE.map((c, i) => (
                <li key={c.day} className="relative flex gap-4 pb-5 last:pb-0">
                  {i < CADENCE.length - 1 ? <span className="absolute left-[15px] top-8 h-full w-px bg-border" /> : null}
                  <span className="z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-soft ring-1 ring-accent/40">
                    <c.icon className="h-4 w-4 text-accent-bright" />
                  </span>
                  <div>
                    <p className="text-[13px] font-semibold">{c.day}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-ink-dim">{c.what}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Script editor */}
          <ScriptEditor />
        </div>

        {/* Call log */}
        <section className="card overflow-hidden">
          <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
            <h2 className="font-display text-xl font-medium">Today&apos;s Activity</h2>
            <button className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-1.5 text-[12px] text-ink-dim hover:text-ink">
              <FileDown className="h-3.5 w-3.5" /> Export all
            </button>
          </div>
          <ul className="divide-y divide-border">
            {logs.map((c) => (
              <li key={c.id} className="px-5 py-4">
                <div className="flex flex-wrap items-center gap-3">
                  <p className="text-[13px] font-medium">
                    {c.ownerName} <span className="text-ink-faint">· {c.leadName}</span>
                  </p>
                  <span className={`rounded px-2 py-0.5 text-[11px] font-medium ring-1 ${OUTCOME_CLS[c.outcome]}`}>
                    {c.outcome.replace(/_/g, " ")}
                  </span>
                  <span className="text-[11px] text-ink-faint">
                    attempt {c.attempt} · {Math.floor(c.durationSec / 60)}m{c.durationSec % 60}s ·{" "}
                    {new Date(c.when).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                  </span>
                  <div className="ml-auto flex gap-1.5">
                    <button className="flex items-center gap-1.5 rounded border border-border bg-surface px-2.5 py-1 text-[11px] text-ink-dim hover:border-accent/40 hover:text-ink">
                      <Headphones className="h-3 w-3" /> Recording
                    </button>
                    <button className="rounded border border-border bg-surface px-2.5 py-1 text-[11px] text-ink-dim hover:border-accent/40 hover:text-ink">
                      Transcript
                    </button>
                    {c.outcome === "pending_action" ? (
                      <button className="rounded bg-accent px-2.5 py-1 text-[11px] font-medium text-white hover:bg-accent-bright">
                        Action now
                      </button>
                    ) : null}
                  </div>
                </div>
                <p className="mt-2 rounded-lg bg-surface px-3 py-2 text-[12px] italic leading-relaxed text-ink-dim ring-1 ring-border">
                  &ldquo;{c.transcriptSnippet}&rdquo;
                </p>
              </li>
            ))}
          </ul>
          <p className="border-t border-border px-5 py-3 text-[12px] text-ink-faint">
            Voice agent activates with <code className="font-mono">RETELL_API_KEY</code> (adapter in
            src/lib/outreach/voice.ts) · calls respect TCPA windows and DNC scrubbing
          </p>
        </section>
      </main>
    </>
  );
}
