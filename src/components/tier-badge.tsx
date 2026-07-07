import { Tier } from "@/lib/types";

const STYLES: Record<Tier, { dot: string; text: string; ring: string; label: string }> = {
  platinum: { dot: "bg-platinum", text: "text-platinum", ring: "ring-platinum/25", label: "Platinum" },
  gold: { dot: "bg-gold", text: "text-gold", ring: "ring-gold/25", label: "Gold" },
  silver: { dot: "bg-silver", text: "text-silver", ring: "ring-silver/25", label: "Silver" },
  black: { dot: "bg-tierblack", text: "text-ink-faint", ring: "ring-tierblack/30", label: "Black" },
};

export function TierBadge({ tier, size = "sm" }: { tier: Tier; size?: "sm" | "md" }) {
  const s = STYLES[tier];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full ring-1 ${s.ring} ${s.text} ${
        size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } font-medium uppercase tracking-wider bg-surface`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

export function ScorePill({ score, tier }: { score: number; tier: Tier }) {
  const color = tier === "platinum" ? "text-platinum" : tier === "gold" ? "text-gold" : tier === "silver" ? "text-silver" : "text-ink-faint";
  return (
    <span className={`font-mono text-sm font-semibold tabular-nums ${color}`}>
      {score.toFixed(1)}
    </span>
  );
}
