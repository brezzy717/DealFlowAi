import { Topbar } from "@/components/topbar";
import { getUpcomingAppointments } from "@/lib/data/store";
import { CalendarPlus, Download, Link2 } from "lucide-react";

const KIND: Record<string, string> = {
  discovery_call: "Discovery call",
  valuation_presentation: "Valuation presentation",
  listing_agreement: "Listing agreement",
};
const SOURCE: Record<string, string> = {
  ai_concierge: "AI Concierge",
  magic_link: "Self-booked",
  broker: "You",
};

export default function CalendarPage() {
  const appts = getUpcomingAppointments();
  const start = new Date("2026-07-07");
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    return d;
  });
  const apptsByDay = (d: Date) => appts.filter((a) => new Date(a.when).toDateString() === d.toDateString());

  return (
    <>
      <Topbar title="Calendar" subtitle="30-day forward view. Bookings auto-confirm with email/SMS to all parties." />
      <main className="space-y-6 px-8 py-6">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white hover:bg-accent-bright">
            <CalendarPlus className="h-4 w-4" /> New appointment
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-[13px] text-ink-dim hover:text-ink">
            <Link2 className="h-4 w-4" /> My booking link
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-[13px] text-ink-dim hover:text-ink">
            <Download className="h-4 w-4" /> Export (.ics)
          </button>
          <p className="ml-auto text-[12px] text-ink-faint">
            Cal.com booking + Google Calendar sync activate with <code className="font-mono">CALCOM_API_KEY</code>
          </p>
        </div>

        {/* 30-day grid */}
        <div className="card p-4">
          <div className="grid grid-cols-7 gap-1.5">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
              <div key={d} className="px-2 py-1 text-[11px] uppercase tracking-wider text-ink-faint">
                {d}
              </div>
            ))}
            {/* pad to Monday start; Jul 7 2026 is a Tuesday */}
            <div />
            {days.map((d) => {
              const dayAppts = apptsByDay(d);
              const isDropDay = d.getDay() === 2;
              return (
                <div
                  key={d.toISOString()}
                  className={`min-h-20 rounded-lg border p-2 ${
                    dayAppts.length ? "border-accent/40 bg-accent-soft/40" : "border-border bg-surface/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-display text-lg font-medium leading-none">{d.getDate()}</span>
                    {isDropDay ? <span className="text-[9px] uppercase tracking-wide text-accent-bright">drop 6am</span> : null}
                  </div>
                  {dayAppts.map((a) => (
                    <p key={a.id} className="mt-1.5 truncate rounded bg-card px-1.5 py-1 text-[11px] text-ink-dim ring-1 ring-border">
                      {new Date(a.when).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} · {a.ownerName}
                    </p>
                  ))}
                </div>
              );
            })}
          </div>
        </div>

        {/* Week list */}
        <section className="card overflow-hidden">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="font-display text-xl font-medium">This Week</h2>
          </div>
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-border bg-surface/60 text-[11px] uppercase tracking-wider text-ink-faint">
              <tr>
                <th className="px-5 py-2.5 font-medium">When</th>
                <th className="px-5 py-2.5 font-medium">With</th>
                <th className="hidden px-5 py-2.5 font-medium md:table-cell">Type</th>
                <th className="hidden px-5 py-2.5 font-medium md:table-cell">Booked by</th>
                <th className="px-5 py-2.5 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {appts.map((a) => {
                const d = new Date(a.when);
                return (
                  <tr key={a.id} className="transition hover:bg-card-hover">
                    <td className="px-5 py-3 font-mono text-[12px]">
                      {d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}{" "}
                      {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                    </td>
                    <td className="px-5 py-3">
                      {a.ownerName} <span className="text-ink-faint">· {a.leadName}</span>
                    </td>
                    <td className="hidden px-5 py-3 text-ink-dim md:table-cell">{KIND[a.kind]}</td>
                    <td className="hidden px-5 py-3 text-ink-dim md:table-cell">{SOURCE[a.source]}</td>
                    <td className="px-5 py-3">
                      <span className="rounded bg-teal-soft px-2 py-0.5 text-[11px] font-medium text-teal ring-1 ring-teal/30">
                        confirmed
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </main>
    </>
  );
}
