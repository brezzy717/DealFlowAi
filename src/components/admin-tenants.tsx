"use client";

import { useState } from "react";
import { Tenant } from "@/lib/data/crm";
import { Undo2 } from "lucide-react";

const STATUS_CLS: Record<Tenant["status"], string> = {
  active: "bg-teal-soft text-teal ring-teal/30",
  past_due: "bg-warning/10 text-warning ring-warning/25",
  churned: "bg-danger/10 text-danger ring-danger/25",
};

export function AdminTenants({ tenants, live = false }: { tenants: Tenant[]; live?: boolean }) {
  const [clawback, setClawback] = useState<Tenant | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const confirmClawback = async () => {
    if (!clawback) return;
    const target = clawback;
    setClawback(null);
    if (live) {
      try {
        const res = await fetch("/api/admin/clawback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tenantId: target.id }),
        });
        const data = await res.json();
        setToast(
          res.ok
            ? `Clawback executed for ${target.company}: ${data.clawedBack} uncontacted lead(s) returned to the color pool. Audit rows written.`
            : `Clawback failed: ${data.error}`,
        );
      } catch {
        setToast("Clawback failed — network error.");
      }
    } else {
      setToast(`(Demo) Clawback for ${target.company}: uncontacted leads would return to the pool with audit rows.`);
    }
    setTimeout(() => setToast(null), 7000);
  };

  return (
    <section className="card overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-5 py-3.5">
        <h2 className="font-display text-xl font-medium">Tenants</h2>
        <span className="text-[12px] text-ink-faint">{tenants.length} accounts</span>
      </div>
      <table className="w-full text-left text-[13px]">
        <thead className="border-b border-border bg-surface/60 text-[11px] uppercase tracking-wider text-ink-faint">
          <tr>
            <th className="px-5 py-3 font-medium">Broker</th>
            <th className="hidden px-5 py-3 font-medium md:table-cell">Tier</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="hidden px-5 py-3 text-right font-medium lg:table-cell">Leads</th>
            <th className="hidden px-5 py-3 text-right font-medium lg:table-cell">Contacted</th>
            <th className="hidden px-5 py-3 text-right font-medium md:table-cell">MRR</th>
            <th className="px-5 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tenants.map((t) => (
            <tr key={t.id} className="transition hover:bg-card-hover">
              <td className="px-5 py-3">
                <p className="font-medium">{t.company}</p>
                <p className="text-[12px] text-ink-faint">{t.broker}</p>
              </td>
              <td className="hidden px-5 py-3 md:table-cell">Tier {t.tier}</td>
              <td className="px-5 py-3">
                <span className={`rounded px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ${STATUS_CLS[t.status]}`}>
                  {t.status.replace("_", " ")}
                </span>
              </td>
              <td className="hidden px-5 py-3 text-right font-mono lg:table-cell">{t.leadsAssigned}</td>
              <td className={`hidden px-5 py-3 text-right font-mono lg:table-cell ${t.contactedPct < 50 ? "text-warning" : ""}`}>
                {t.contactedPct}%
              </td>
              <td className="hidden px-5 py-3 text-right font-mono md:table-cell">${t.mrr.toLocaleString()}</td>
              <td className="px-5 py-3 text-right">
                <button
                  onClick={() => setClawback(t)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface px-2.5 py-1 text-[12px] text-ink-dim hover:border-accent/40 hover:text-ink"
                >
                  <Undo2 className="h-3.5 w-3.5" /> Clawback
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {clawback ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={() => setClawback(null)}>
          <div className="card w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-display text-2xl font-medium">Claw back leads — {clawback.company}?</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
              All leads assigned to this tenant with <span className="text-ink">no contact logged</span> will be revoked and
              returned to the color pool for redistribution on the next drop day. Leads with contact history stay assigned.
              This action is audited.
            </p>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setClawback(null)} className="rounded-lg border border-border px-4 py-2 text-[13px] text-ink-dim hover:text-ink">
                Cancel
              </button>
              <button onClick={confirmClawback} className="rounded-lg bg-danger px-4 py-2 text-[13px] font-medium text-white hover:opacity-90">
                Confirm clawback
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {toast ? (
        <div className="fixed bottom-6 left-1/2 z-50 w-full max-w-lg -translate-x-1/2 rounded-lg border border-teal/30 bg-teal-soft px-4 py-3 text-[13px] text-teal shadow-xl">
          {toast}
        </div>
      ) : null}
    </section>
  );
}
