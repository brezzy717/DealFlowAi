import { SourceTag } from "@/lib/types";

const META: Record<SourceTag, { label: string; cls: string }> = {
  stale_listing: { label: "Stale Listing", cls: "bg-accent-soft text-accent-bright ring-accent/30" },
  estate: { label: "Estate", cls: "bg-teal-soft text-teal ring-teal/30" },
  distress: { label: "Distress", cls: "bg-danger/10 text-danger ring-danger/25" },
  succession: { label: "Succession", cls: "bg-warning/10 text-warning ring-warning/25" },
  intent: { label: "Sale Intent", cls: "bg-accent-soft text-accent-bright ring-accent/30" },
};

export function SourceTagChips({ tags, max = 2 }: { tags: SourceTag[]; max?: number }) {
  if (!tags.length) return null;
  return (
    <>
      {tags.slice(0, max).map((t) => (
        <span
          key={t}
          className={`inline-flex rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide ring-1 ${META[t].cls}`}
        >
          {META[t].label}
        </span>
      ))}
    </>
  );
}
