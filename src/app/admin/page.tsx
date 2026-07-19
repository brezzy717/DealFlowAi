import Link from "next/link";
import { AdminTenants } from "@/components/admin-tenants";
import { KpiCard } from "@/components/kpi-card";
import { BarChart } from "@/components/charts";
import { ADMIN_KPIS, SOURCE_FRESHNESS, getTenants } from "@/lib/data/crm";
import { getScoredLeads } from "@/lib/data/store";
import { getLiveTenants, getLivePoolStats } from "@/lib/data/live";
import { Users, DollarSign, Send, Target, ShieldCheck, ArrowLeft } from "lucide-react";

const FRESH_CLS: Record<string, string> = {
  ok: "bg-teal-soft text-teal ring-teal/30",
  degraded: "bg-warning/10 text-warning ring-warning/25",
  stale: "bg-danger/10 text-danger ring-danger/25",
};

export default async function AdminPage() {
  const [liveTenants, pool] = await Promise.all([getLiveTenants(), getLivePoolStats()]);
  const tenants = liveTenants ?? getTenants();
  // Score distribution histogram for drift monitoring — live pool when available
  const buckets =
    pool?.histogram ??
    Array.from({ length: 10 }, (_, i) => ({
      label: `${i * 10}`,
      value: getScoredLeads().filter((l) => l.score >= i * 10 && l.score < (i + 1) * 10).length,
    }));
  const poolCards = pool
    ? [
        ["Platinum", `${pool.byTier.platinum.unassigned}`, `of ${pool.byTier.platinum.total} total`, "text-platinum"],
        ["Gold", `${pool.byTier.gold.unassigned}`, `of ${pool.byTier.gold.total} total`, "text-gold"],
        ["Silver", `${pool.byTier.silver.unassigned}`, `of ${pool.byTier.silver.total} total`, "text-silver"],
        ["Black (monitor)", `${pool.byTier.black.total}`, "never distributed", "text-ink-faint"],
      ]
    : [
        ["Platinum", ADMIN_KPIS.poolPlatinum.toLocaleString(), "", "text-platinum"],
        ["Gold", ADMIN_KPIS.poolGold.toLocaleString(), "", "text-gold"],
        ["Silver", ADMIN_KPIS.poolSilver.toLocaleString(), "", "text-silver"],
        ["Black (monitor)", "37.9M", "", "text-ink-faint"],
      ];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg/80 px-8 py-4 backdrop-blur">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Admin — Mission Control</h1>
          <p className="mt-0.5 text-[13px] text-ink-dim">Tenants, lead pool, distribution, model health, and clawbacks.</p>
        </div>
        <Link href="/dashboard" className="flex items-center gap-2 text-[13px] text-accent-bright hover:underline">
          <ArrowLeft className="h-4 w-4" /> Broker dashboard
        </Link>
      </header>

      <main className="space-y-6 px-8 py-6">
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <KpiCard label="Active Tenants" value={String(ADMIN_KPIS.activeTenants)} delta="1 past due · 1 churned" deltaGood={false} icon={Users} />
          <KpiCard label="MRR" value={`$${(ADMIN_KPIS.mrr / 1000).toFixed(1)}K`} delta="+$5.5K this month" deltaGood icon={DollarSign} />
          <KpiCard label="Leads Distributed (wk)" value={String(ADMIN_KPIS.leadsDistributedThisWeek)} delta="6 tenants × 15" deltaGood icon={Send} />
          <KpiCard label="Precision @ Platinum" value={`${Math.round(ADMIN_KPIS.modelPrecisionPlatinum * 100)}%`} delta={`rules vs ensemble ${ADMIN_KPIS.rulesVsEnsembleDelta}`} deltaGood icon={Target} />
        </div>

        <div className="grid gap-6 xl:grid-cols-2">
          <section className="card p-5">
            <h2 className="font-display text-xl font-medium">Lead Pool by Tier</h2>
            <p className="mt-1 text-[12px] text-ink-faint">
              {pool ? "Live pool — unassigned (distributable) inventory" : "Distributable inventory vs. the Black monitor pool"}
            </p>
            <div className="mt-4 grid grid-cols-4 gap-3 text-center">
              {poolCards.map(([label, val, sub, cls]) => (
                <div key={label} className="rounded-lg bg-surface px-2 py-3 ring-1 ring-border">
                  <p className={`font-display text-2xl font-medium tabular-nums ${cls}`}>{val}</p>
                  <p className="mt-1 text-[11px] text-ink-faint">{label}</p>
                  {sub ? <p className="text-[10px] text-ink-faint">{sub}</p> : null}
                </div>
              ))}
            </div>
            <h3 className="mt-6 flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
              <ShieldCheck className="h-4 w-4" /> Score distribution (drift monitor)
            </h3>
            <p className="mt-1 text-[12px] text-ink-faint">
              {pool ? "Live scored pool · PSI monitoring starts with real ingestion" : "Demo book sample · PSI vs. baseline: 0.04 (healthy, alert at 0.2)"}
            </p>
            <div className="mt-2">
              <BarChart data={buckets} height={140} />
            </div>
          </section>

          <section className="card overflow-hidden">
            <div className="border-b border-border px-5 py-3.5">
              <h2 className="font-display text-xl font-medium">Ingestion Source Freshness</h2>
            </div>
            <table className="w-full text-left text-[13px]">
              <thead className="border-b border-border bg-surface/60 text-[11px] uppercase tracking-wider text-ink-faint">
                <tr>
                  <th className="px-5 py-2.5 font-medium">Source</th>
                  <th className="hidden px-5 py-2.5 font-medium md:table-cell">Cadence</th>
                  <th className="hidden px-5 py-2.5 font-medium lg:table-cell">Last run</th>
                  <th className="px-5 py-2.5 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {SOURCE_FRESHNESS.map((s) => (
                  <tr key={s.source}>
                    <td className="px-5 py-2.5">{s.source}</td>
                    <td className="hidden px-5 py-2.5 text-ink-faint md:table-cell">{s.cadence}</td>
                    <td className="hidden px-5 py-2.5 font-mono text-[12px] text-ink-faint lg:table-cell">{s.lastRun}</td>
                    <td className="px-5 py-2.5">
                      <span className={`rounded px-2 py-0.5 text-[11px] font-medium ring-1 ${FRESH_CLS[s.status]}`}>{s.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="border-t border-border px-5 py-3 text-[12px] text-ink-faint">
              Stale sources mark their features degraded and lower confidence scores — they never silently score on old data.
            </p>
          </section>
        </div>

        <AdminTenants tenants={tenants} live={Boolean(liveTenants)} />
      </main>
    </div>
  );
}
