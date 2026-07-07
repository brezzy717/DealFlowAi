import { Activity } from "lucide-react";

export interface TickerItem {
  label: string;
  value: string;
  tone?: "accent" | "teal";
}

export function SignalsTicker({ items }: { items: TickerItem[] }) {
  const Chip = ({ item }: { item: TickerItem }) => (
    <span
      className={`shrink-0 rounded-md border px-2.5 py-1 text-[12px] ${
        item.tone === "teal"
          ? "border-teal/25 bg-teal-soft text-teal"
          : "border-accent/25 bg-accent-soft text-accent-bright"
      }`}
    >
      {item.label} <span className="font-mono font-semibold">{item.value}</span>
    </span>
  );

  return (
    <div className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-4 py-2">
        <Activity className="h-3.5 w-3.5 text-accent-bright" />
        <span className="text-[12px] uppercase tracking-wider text-ink-dim">Pipeline Signals</span>
        <span className="ml-auto text-[11px] text-ink-faint">live · Tuesday drop cycle</span>
      </div>
      <div className="relative overflow-hidden py-2">
        <div className="marquee flex w-max gap-3 px-3">
          {[0, 1].map((dup) => (
            <div key={dup} className="flex shrink-0 gap-3" aria-hidden={dup === 1}>
              {items.map((item) => (
                <Chip key={`${dup}-${item.label}`} item={item} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
