import { Topbar } from "@/components/topbar";
import { KpiCard } from "@/components/kpi-card";
import { SignalsTicker } from "@/components/signals-ticker";
import { SourceTagChips } from "@/components/source-tag";
import { TierBadge, ScorePill } from "@/components/tier-badge";
import {
  DEMO_KPIS,
  getAvgScoreLatestDrop,
  getHotLeadCount,
  getLatestDrop,
  getNeedsAction,
  getTierCounts,
  getUpcomingAppointments,
} from "@/lib/data/store";
import { DollarSign, TrendingUp, CalendarCheck2, Percent, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

const fmtMoney = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1_000).toFixed(0)}K`;

const APPT_KIND: Record<string, string> = {
  discovery_call: "Discovery call",
  valuation_presentation: "Valuation presentation",
  listing_agreement: "Listing agreement",
};

const APPT_SOURCE: Record<string, string> = {
  ai_concierge: "Booked by AI Concierge",
  magic_link: "Self-booked via email link",
  broker: "Booked by you",
};

export default function HomePage() {
  const drop = getLatestDrop();
  const needsAction = getNeedsAction().slice(0, 5);
  const appointments = getUpcomingAppointments().slice(0, 5);
  const tiers = getTierCounts();

  return (
    <>
      <Topbar
        title="Good morning, Reshie"
        subtitle={`This week's drop landed Tuesday 6:00 AM — ${drop.length} new prospects. Next drop: Tue, Jul 7.`}
      />
      <main className="space-y-6 px-8 py-6">
        {/* Pipeline signals ticker — the at-a-glance value strip */}
        <SignalsTicker
          items={[
            { label: "New scored leads", value: `+${drop.length}` },
            { label: "Hot (Platinum) leads", value: String(getHotLeadCount()) },
            { label: "Appts today", value: "3", tone: "teal" },
            { label: "Avg score this drop", value: String(getAvgScoreLatestDrop()) },
            { label: "YTD commissions", value: fmtMoney(DEMO_KPIS.ytdCommissions), tone: "teal" },
            { label: "Deals closed YTD", value: String(DEMO_KPIS.dealsClosedYtd), tone: "teal" },
            { label: "Win rate", value: `${Math.round(DEMO_KPIS.closeRate * 100)}%` },
            { label: "Avg days to close", value: String(DEMO_KPIS.avgDaysToClose) },
            { label: "Pipeline value", value: fmtMoney(DEMO_KPIS.pipelineValue), tone: "teal" },
          ]}
        />

        {/* KPI row */}
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <KpiCard label="YTD Commissions" value={fmtMoney(DEMO_KPIS.ytdCommissions)} delta="+18% vs last year" deltaGood icon={DollarSign} />
          <KpiCard label="Pipeline Value" value={fmtMoney(DEMO_KPIS.pipelineValue)} delta="4 deals in diligence" deltaGood icon={TrendingUp} />
          <KpiCard label="Meetings Booked (30d)" value={String(DEMO_KPIS.bookedThisMonth)} delta="7 by AI Concierge" deltaGood icon={CalendarCheck2} />
          <KpiCard label="Close Rate" value={`${Math.round(DEMO_KPIS.closeRate * 100)}%`} delta="Platinum converts 2.6× Silver" deltaGood icon={Percent} />
        </div>

        <div className="grid gap-6 xl:grid-cols-3">
          {/* Latest drop */}
          <section className="card xl:col-span-2">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <div>
                <h2 className="text-[15px] font-semibold">This Week&apos;s Drop</h2>
                <p className="text-[12px] text-ink-dim">
                  {tiers.platinum} Platinum · {tiers.gold} Gold · {tiers.silver} Silver in your active book
                </p>
              </div>
              <Link href="/dashboard/prospects" className="flex items-center gap-1 text-[13px] text-accent-bright hover:underline">
                All prospects <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <ul className="divide-y divide-border">
              {drop.slice(0, 6).map((lead) => (
                <li key={lead.business.id} className="px-5 py-4 transition hover:bg-card-hover">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2.5">
                        <span className="truncate text-[14px] font-medium">{lead.business.name}</span>
                        <TierBadge tier={lead.tier} />
                        <SourceTagChips tags={lead.sourceTags} />
                        {lead.confidenceFlag ? (
                          <span className="rounded bg-warning/10 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-warning">
                            verify contact
                          </span>
                        ) : null}
                      </div>
                      <p className="mt-1 line-clamp-2 text-[13px] leading-relaxed text-ink-dim">{lead.explanation}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <ScorePill score={lead.score} tier={lead.tier} />
                      <p className="mt-0.5 text-[11px] text-ink-faint">{lead.saleWindow}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <div className="space-y-6">
            {/* Needs action */}
            <section className="card">
              <div className="flex items-center gap-2 border-b border-border px-5 py-4">
                <AlertCircle className="h-4 w-4 text-warning" />
                <h2 className="text-[15px] font-semibold">Needs Action</h2>
                <span className="ml-auto rounded-full bg-warning/10 px-2 py-0.5 text-[11px] font-medium text-warning">
                  {getNeedsAction().length}
                </span>
              </div>
              <ul className="divide-y divide-border">
                {needsAction.map((lead) => (
                  <li key={lead.business.id} className="flex items-center justify-between px-5 py-3">
                    <div>
                      <p className="text-[13px] font-medium">{lead.business.name}</p>
                      <p className="text-[12px] text-ink-faint">Outreach outcome not logged — feeds the model</p>
                    </div>
                    <button className="rounded-md border border-border bg-surface px-2.5 py-1 text-[12px] text-ink-dim hover:border-accent/40 hover:text-ink">
                      Action
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            {/* Upcoming appointments */}
            <section className="card">
              <div className="border-b border-border px-5 py-4">
                <h2 className="text-[15px] font-semibold">Upcoming Appointments</h2>
              </div>
              <ul className="divide-y divide-border">
                {appointments.map((a) => {
                  const d = new Date(a.when);
                  return (
                    <li key={a.id} className="flex items-center gap-3 px-5 py-3">
                      <div className="w-12 shrink-0 rounded-lg bg-surface py-1.5 text-center ring-1 ring-border">
                        <p className="text-[10px] uppercase text-ink-faint">
                          {d.toLocaleDateString("en-US", { month: "short" })}
                        </p>
                        <p className="font-mono text-[15px] font-semibold leading-none">{d.getDate()}</p>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium">
                          {a.ownerName} · {a.leadName}
                        </p>
                        <p className="text-[12px] text-ink-faint">
                          {d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })} — {APPT_KIND[a.kind]} ·{" "}
                          {APPT_SOURCE[a.source]}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </>
  );
}
