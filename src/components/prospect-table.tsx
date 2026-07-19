"use client";

import { useMemo, useState } from "react";
import { ScoredLead, Tier } from "@/lib/types";
import { TierBadge, ScorePill } from "@/components/tier-badge";
import { SourceTagChips } from "@/components/source-tag";
import { ActionOutcome } from "@/components/action-outcome";
import { ChevronDown, Mail, Phone, MapPin, ShieldCheck, ShieldAlert } from "lucide-react";

const TIER_ORDER: Tier[] = ["platinum", "gold", "silver"];

const STATUS_LABEL: Record<string, string> = {
  new: "New",
  contacted: "Contacted",
  meeting_scheduled: "Meeting set",
  needs_action: "Needs action",
  in_pipeline: "In pipeline",
};

export function ProspectTable({ leads, internals = false }: { leads: ScoredLead[]; internals?: boolean }) {
  const [filter, setFilter] = useState<Tier | "all">("all");
  const [open, setOpen] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const tiers = filter === "all" ? TIER_ORDER : [filter];
    return tiers.map((t) => ({
      tier: t,
      leads: leads.filter((l) => l.tier === t).sort((a, z) => z.score - a.score),
    }));
  }, [leads, filter]);

  return (
    <div className="space-y-6">
      {/* Tier filter */}
      <div className="flex items-center gap-2">
        {(["all", ...TIER_ORDER] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t as Tier | "all")}
            className={`rounded-full px-3.5 py-1.5 text-[13px] capitalize transition ${
              filter === t
                ? "bg-accent-soft text-ink ring-1 ring-accent/40"
                : "text-ink-dim ring-1 ring-border hover:text-ink"
            }`}
          >
            {t === "all" ? "All tiers" : t}
          </button>
        ))}
        <p className="ml-auto text-[12px] text-ink-faint">
          {leads.length} active prospects · leads stay assigned to you for life
        </p>
      </div>

      {grouped.map(({ tier, leads: tierLeads }) =>
        tierLeads.length === 0 ? null : (
          <section key={tier} className="card overflow-hidden">
            <div className="flex items-center gap-3 border-b border-border px-5 py-3.5">
              <TierBadge tier={tier} size="md" />
              <span className="text-[12px] text-ink-faint">
                {tierLeads.length} prospects · est. window {tierLeads[0]?.saleWindow}
              </span>
            </div>
            <ul className="divide-y divide-border">
              {tierLeads.map((lead) => {
                const b = lead.business;
                const isOpen = open === b.id;
                return (
                  <li key={b.id}>
                    <button
                      onClick={() => setOpen(isOpen ? null : b.id)}
                      className="grid w-full grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 px-5 py-3.5 text-left transition hover:bg-card-hover"
                    >
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 truncate text-[14px] font-medium">
                          {b.name} <SourceTagChips tags={lead.sourceTags} />
                        </p>
                        <p className="text-[12px] text-ink-faint">
                          {b.industry} · {b.city}, {b.state}
                        </p>
                      </div>
                      <span className="hidden text-[12px] text-ink-dim md:block">
                        {b.owner.name}, {b.owner.age}
                      </span>
                      <span className="hidden rounded-md bg-surface px-2 py-1 text-[11px] text-ink-dim ring-1 ring-border lg:block">
                        {STATUS_LABEL[lead.status]}
                      </span>
                      <ScorePill score={lead.score} tier={lead.tier} />
                      <ChevronDown className={`h-4 w-4 text-ink-faint transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>

                    {isOpen ? <ProspectDetail lead={lead} internals={internals} /> : null}
                  </li>
                );
              })}
            </ul>
          </section>
        ),
      )}
    </div>
  );
}

/**
 * Broker-facing detail. PROPRIETARY GUARD: weights, point values, category
 * caps, stacking math, and data-source names are trade secrets — brokers see
 * the natural-language explanation and plain-English signal descriptions only.
 * Pass internals={true} ONLY in admin contexts.
 */
function ProspectDetail({ lead, internals = false }: { lead: ScoredLead; internals?: boolean }) {
  const b = lead.business;
  return (
    <div className="grid gap-6 border-t border-border bg-surface/60 px-5 py-5 lg:grid-cols-[1.2fr_1fr]">
      <div className="space-y-4">
        {/* Why this lead */}
        <div>
          <h4 className="text-[12px] font-semibold uppercase tracking-wider text-ink-faint">
            Why this is a {lead.tier} lead
          </h4>
          <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">{lead.explanation}</p>
        </div>

        {/* Key signals — plain English, no weights or sources */}
        <div>
          <h4 className="text-[12px] font-semibold uppercase tracking-wider text-ink-faint">What we&apos;re seeing</h4>
          <ul className="mt-2 space-y-1.5">
            {lead.topSignals.map((s) => (
              <li key={`${s.id}-${s.detail}`} className="flex items-baseline gap-2.5 text-[13px]">
                <span className="mt-1 h-1 w-1 shrink-0 rounded-full bg-accent" />
                <span className="text-ink-dim">
                  {s.detail}
                  {internals ? (
                    <span className="ml-2 font-mono text-[11px] text-accent-bright">
                      +{s.points.toFixed(1)} · {s.source}
                    </span>
                  ) : null}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {internals ? (
          <>
            {lead.interactions.length > 0 ? (
              <div>
                <h4 className="text-[12px] font-semibold uppercase tracking-wider text-ink-faint">Compound interactions (internal)</h4>
                <ul className="mt-2 space-y-1.5">
                  {lead.interactions.map((ix) => (
                    <li key={ix.name} className="flex items-baseline justify-between gap-3 text-[13px]">
                      <span className="text-ink-dim">
                        <span className="font-medium text-accent-bright">{ix.name}</span> — {ix.detail}
                      </span>
                      <span className="shrink-0 font-mono text-[12px] text-accent-bright">+{ix.points}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div>
              <h4 className="text-[12px] font-semibold uppercase tracking-wider text-ink-faint">Signal categories (internal)</h4>
              <div className="mt-2 space-y-1.5">
                {lead.categories
                  .filter((c) => c.points > 0)
                  .map((c) => (
                    <div key={c.id} className="flex items-center gap-3">
                      <span className="w-44 shrink-0 text-[12px] text-ink-dim">{c.label}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-border">
                        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (c.points / c.cap) * 100)}%` }} />
                      </div>
                      <span className="w-14 shrink-0 text-right font-mono text-[11px] text-ink-faint">
                        {c.points}/{c.cap}
                      </span>
                    </div>
                  ))}
              </div>
              <p className="mt-2 text-[11px] text-ink-faint">
                (Base {lead.baseScore}
                {lead.interactions.length > 0 ? ` + ${Math.min(9, lead.interactions.reduce((a, i) => a + i.points, 0))} compound` : ""}
                ) × {lead.stackMultiplier.toFixed(2)} stacking = {lead.score} · Data confidence {(lead.confidence * 100).toFixed(0)}%
              </p>
            </div>
          </>
        ) : (
          <p className="text-[11px] text-ink-faint">
            Estimated sale window: {lead.saleWindow} · Contact{" "}
            {b.owner.contactVerified ? "verified" : "verification in progress"} · Scored{" "}
            {new Date(lead.scoredAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </p>
        )}
      </div>

      {/* Contact + business facts */}
      <div className="space-y-4">
        <div className="card bg-card p-4">
          <div className="flex items-center justify-between">
            <h4 className="text-[13px] font-semibold">{b.owner.name}</h4>
            {b.owner.contactVerified ? (
              <span className="flex items-center gap-1 text-[11px] text-success">
                <ShieldCheck className="h-3.5 w-3.5" /> verified
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[11px] text-warning">
                <ShieldAlert className="h-3.5 w-3.5" /> unverified
              </span>
            )}
          </div>
          <ul className="mt-3 space-y-2 text-[13px] text-ink-dim">
            <li className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-ink-faint" /> {b.owner.email}</li>
            <li className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-ink-faint" /> {b.owner.phone}</li>
            <li className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-ink-faint" /> {b.city}, {b.state} {b.zip}</li>
          </ul>
        </div>

        <dl className="grid grid-cols-2 gap-3 text-[13px]">
          <Fact label="Est. revenue" value={`$${(b.revenueEstimate / 1_000_000).toFixed(1)}M`} />
          <Fact label="Employees" value={String(b.employeeCount)} />
          <Fact label="Founded" value={String(b.foundedYear)} />
          <Fact label="Owner tenure" value={`${b.owner.yearsOwnership} yrs`} />
          <Fact label="NAICS" value={b.naics} />
          <Fact label="Sale window" value={lead.saleWindow} />
        </dl>

        <div className="space-y-2">
          <ActionOutcome assignmentId={lead.assignmentId} />
          <div className="flex flex-wrap gap-2">
            <MoveToPipeline assignmentId={lead.assignmentId} />
            {["Send Email", "Open Deal Room"].map((a) => (
              <button
                key={a}
                className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] text-ink-dim transition hover:border-accent/40 hover:text-ink"
              >
                {a}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function MoveToPipeline({ assignmentId }: { assignmentId?: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  if (!assignmentId) {
    return (
      <button disabled className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] text-ink-faint opacity-60">
        Move to Pipeline
      </button>
    );
  }
  if (state === "done") {
    return <span className="rounded-md bg-teal-soft px-3 py-1.5 text-[12px] font-medium text-teal ring-1 ring-teal/30">In pipeline ✓</span>;
  }
  return (
    <button
      onClick={async () => {
        setState("busy");
        const { createDealFromAssignment } = await import("@/app/dashboard/crm-actions");
        const res = await createDealFromAssignment(assignmentId);
        setState(res.ok ? "done" : "idle");
      }}
      disabled={state === "busy"}
      className="rounded-md border border-border bg-card px-3 py-1.5 text-[12px] text-ink-dim transition hover:border-accent/40 hover:text-ink disabled:opacity-50"
    >
      {state === "busy" ? "Moving…" : "Move to Pipeline"}
    </button>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-card px-3 py-2 ring-1 ring-border">
      <dt className="text-[11px] uppercase tracking-wider text-ink-faint">{label}</dt>
      <dd className="mt-0.5 font-mono text-[13px]">{value}</dd>
    </div>
  );
}
