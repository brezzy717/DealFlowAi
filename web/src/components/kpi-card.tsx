import { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  delta,
  deltaGood,
  icon: Icon,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaGood?: boolean;
  icon: LucideIcon;
}) {
  return (
    <div className="card p-5 transition-colors hover:bg-card-hover">
      <div className="flex items-center justify-between">
        <p className="text-[13px] text-ink-dim">{label}</p>
        <Icon className="h-4 w-4 text-accent-bright" />
      </div>
      <div className="mt-1.5 flex items-end justify-between gap-3">
        <div>
          <p className="font-display text-4xl font-medium tabular-nums leading-none tracking-tight">{value}</p>
          {delta ? (
            <p className={`mt-1.5 text-[12px] ${deltaGood ? "text-teal" : "text-danger"}`}>{delta}</p>
          ) : null}
        </div>
        <div className="h-10 w-20 shrink-0 rounded-sm border border-accent/20 bg-gradient-to-t from-accent/15 to-transparent" />
      </div>
    </div>
  );
}
