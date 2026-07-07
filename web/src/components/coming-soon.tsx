import { Topbar } from "@/components/topbar";
import { Construction } from "lucide-react";

export function ComingSoon({
  title,
  subtitle,
  bullets,
  phase,
}: {
  title: string;
  subtitle: string;
  bullets: string[];
  phase: string;
}) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <main className="px-8 py-6">
        <div className="card mx-auto max-w-2xl p-8">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft ring-1 ring-accent/30">
              <Construction className="h-4.5 w-4.5 text-accent-bright" />
            </span>
            <div>
              <p className="text-[14px] font-semibold">Scheduled for {phase}</p>
              <p className="text-[12px] text-ink-faint">Spec is locked — build order per the phase plan</p>
            </div>
          </div>
          <ul className="mt-5 space-y-2.5">
            {bullets.map((b) => (
              <li key={b} className="flex gap-2.5 text-[13px] text-ink-dim">
                <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" />
                {b}
              </li>
            ))}
          </ul>
        </div>
      </main>
    </>
  );
}
