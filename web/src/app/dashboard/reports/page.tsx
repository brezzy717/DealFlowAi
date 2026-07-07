import { Topbar } from "@/components/topbar";
import { BarChart, Donut, HBarList } from "@/components/charts";
import { KpiCard } from "@/components/kpi-card";
import { DEMO_KPIS } from "@/lib/data/store";
import { DollarSign, Percent, Timer, Trophy, Printer } from "lucide-react";

const COMMISSIONS_BY_MONTH = [
  { label: "Jan", value: 41 }, { label: "Feb", value: 0 }, { label: "Mar", value: 88 },
  { label: "Apr", value: 52 }, { label: "May", value: 96 }, { label: "Jun", value: 78 }, { label: "Jul", value: 57.5 },
];

const LEADERBOARD = [
  { broker: "You", appts: 41, conversions: 14 },
  { broker: "D. Okafor", appts: 42, conversions: 13 },
  { broker: "S. Marlowe", appts: 38, conversions: 12 },
  { broker: "T. Rousseau", appts: 29, conversions: 9 },
  { broker: "J. Petrides", appts: 25, conversions: 7 },
];

export default function ReportsPage() {
  return (
    <>
      <Topbar title="Reports & Metrics" subtitle="Commissions, conversion by tier color, geography, and how you stack up." />
      <main className="space-y-6 px-8 py-6">
        <div className="flex items-center justify-end gap-2">
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-[13px] text-ink-dim hover:text-ink">
            <Printer className="h-4 w-4" /> Print / Save PDF
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <KpiCard label="YTD Commissions" value="$413K" delta="+18% vs last year" deltaGood icon={DollarSign} />
          <KpiCard label="Close Rate" value={`${Math.round(DEMO_KPIS.closeRate * 100)}%`} delta="+3pts QoQ" deltaGood icon={Percent} />
          <KpiCard label="Avg Days to Close" value={String(DEMO_KPIS.avgDaysToClose)} delta="-11 days vs Q1" deltaGood icon={Timer} />
          <KpiCard label="Leaderboard Rank" value="#1" delta="of 8 brokers on platform" deltaGood icon={Trophy} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="card p-5">
            <h2 className="font-display text-xl font-medium">Commissions by Month ($K)</h2>
            <div className="mt-4">
              <BarChart data={COMMISSIONS_BY_MONTH} />
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-xl font-medium">Conversions by Tier Color</h2>
            <p className="mt-1 text-[12px] text-ink-faint">Appointments that became signed clients, by lead tier at assignment</p>
            <div className="mt-5">
              <Donut
                segments={[
                  { label: "Platinum", value: 8, color: "var(--color-platinum)" },
                  { label: "Gold", value: 4, color: "var(--color-gold)" },
                  { label: "Silver", value: 2, color: "var(--color-silver)" },
                ]}
              />
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-xl font-medium">Activity by Zip Code</h2>
            <p className="mt-1 text-[12px] text-ink-faint">Appointments booked, trailing 90 days</p>
            <div className="mt-4">
              <HBarList
                data={[
                  { label: "85251 Scottsdale", value: 11 },
                  { label: "85004 Phoenix", value: 9 },
                  { label: "85281 Tempe", value: 7 },
                  { label: "85201 Mesa", value: 5 },
                  { label: "89101 Las Vegas", value: 4 },
                ]}
              />
            </div>
          </section>

          <section className="card p-5">
            <h2 className="font-display text-xl font-medium">Platform Leaderboard</h2>
            <p className="mt-1 text-[12px] text-ink-faint">Prospect → active client conversions</p>
            <table className="mt-4 w-full text-left text-[13px]">
              <thead className="text-[11px] uppercase tracking-wider text-ink-faint">
                <tr>
                  <th className="py-2 font-medium">Broker</th>
                  <th className="py-2 text-right font-medium">Appointments</th>
                  <th className="py-2 text-right font-medium">Conversions</th>
                  <th className="py-2 text-right font-medium">Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {LEADERBOARD.map((r, i) => (
                  <tr key={r.broker} className={r.broker === "You" ? "text-accent-bright" : ""}>
                    <td className="py-2.5">
                      #{i + 1} {r.broker}
                    </td>
                    <td className="py-2.5 text-right font-mono">{r.appts}</td>
                    <td className="py-2.5 text-right font-mono">{r.conversions}</td>
                    <td className="py-2.5 text-right font-mono">{Math.round((r.conversions / r.appts) * 100)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </main>
    </>
  );
}
