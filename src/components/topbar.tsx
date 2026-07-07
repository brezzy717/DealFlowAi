import { Search, Bell } from "lucide-react";

export function Topbar({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-bg/80 px-8 py-4 backdrop-blur">
      <div>
        <h1 className="font-display text-3xl font-medium tracking-tight">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-[13px] text-ink-dim">{subtitle}</p> : null}
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-1.5">
          <Search className="h-3.5 w-3.5 text-ink-faint" />
          <input
            placeholder="Search prospects, clients, deals…"
            className="w-56 bg-transparent text-[13px] text-ink outline-none placeholder:text-ink-faint"
          />
        </div>
        <button className="relative rounded-lg border border-border bg-card p-2 text-ink-dim hover:text-ink">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-accent" />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-soft text-[12px] font-semibold text-accent-bright ring-1 ring-accent/30">
          RK
        </div>
      </div>
    </header>
  );
}
