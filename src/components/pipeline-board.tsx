"use client";

import { useEffect, useState } from "react";
import { Deal, PIPELINE_STAGES, PipelineStage } from "@/lib/data/crm";
import { moveDealStage } from "@/app/dashboard/crm-actions";
import { GripVertical } from "lucide-react";

const fmtMoney = (n: number) => (n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : `$${(n / 1_000).toFixed(0)}K`);

export function PipelineBoard({ initial, live = false }: { initial: Deal[]; live?: boolean }) {
  const [deals, setDeals] = useState<Deal[]>(initial);
  const [dragId, setDragId] = useState<string | null>(null);

  // Demo mode persists locally; live mode persists to the deals table
  useEffect(() => {
    if (live) return;
    const saved = localStorage.getItem("df_pipeline_stages");
    if (saved) {
      const map: Record<string, PipelineStage> = JSON.parse(saved);
      setDeals((ds) => ds.map((d) => (map[d.id] ? { ...d, stage: map[d.id] } : d)));
    }
  }, [live]);

  const moveDeal = (id: string, stage: PipelineStage) => {
    setDeals((ds) => {
      const next = ds.map((d) => (d.id === id ? { ...d, stage, daysInStage: 0 } : d));
      if (live) {
        moveDealStage(id, stage); // fire-and-forget; optimistic UI
      } else {
        const map = Object.fromEntries(next.map((d) => [d.id, d.stage]));
        localStorage.setItem("df_pipeline_stages", JSON.stringify(map));
      }
      return next;
    });
  };

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PIPELINE_STAGES.map((stage) => {
        const col = deals.filter((d) => d.stage === stage);
        const colValue = col.reduce((a, d) => a + d.estValue, 0);
        return (
          <div
            key={stage}
            className="w-72 shrink-0"
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => dragId && moveDeal(dragId, stage)}
          >
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h3 className="font-display text-lg font-medium tracking-tight">{stage}</h3>
              <span className="text-[11px] text-ink-faint">
                {col.length} · {fmtMoney(colValue)}
              </span>
            </div>
            <div className="min-h-40 space-y-2.5 rounded-xl border border-border/60 bg-surface/40 p-2.5">
              {col.map((d) => (
                <div
                  key={d.id}
                  draggable
                  onDragStart={() => setDragId(d.id)}
                  onDragEnd={() => setDragId(null)}
                  className={`card cursor-grab p-3.5 transition hover:bg-card-hover active:cursor-grabbing ${
                    dragId === d.id ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-[13px] font-medium leading-snug">{d.business}</p>
                    <GripVertical className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
                  </div>
                  <p className="mt-0.5 text-[12px] text-ink-faint">
                    {d.ownerName} · {d.city}
                  </p>
                  <div className="mt-2.5 flex items-center justify-between">
                    <span className="font-mono text-[13px] font-semibold text-accent-bright">{fmtMoney(d.estValue)}</span>
                    <span className="text-[11px] text-ink-faint">
                      {d.commissionPct}% comm · {d.daysInStage}d in stage
                    </span>
                  </div>
                  <div className="mt-2 flex gap-1.5">
                    {["Deal Room", "Email", "SMS"].map((a) => (
                      <button
                        key={a}
                        className="rounded border border-border bg-surface px-2 py-0.5 text-[11px] text-ink-dim hover:border-accent/40 hover:text-ink"
                      >
                        {a}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {col.length === 0 ? (
                <p className="px-2 py-6 text-center text-[12px] text-ink-faint">Drop deals here</p>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
