"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Target,
  Users,
  KanbanSquare,
  CalendarDays,
  MessagesSquare,
  PhoneCall,
  ListChecks,
  FolderLock,
  BarChart3,
  Settings,
  Zap,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/dashboard/prospects", label: "Prospects", icon: Target },
  { href: "/dashboard/clients", label: "My Clients", icon: Users },
  { href: "/dashboard/pipeline", label: "Active Deals", icon: KanbanSquare },
  { href: "/dashboard/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/dashboard/dealroom", label: "Deal Room", icon: MessagesSquare },
  { href: "/dashboard/concierge", label: "Outreach Concierge", icon: PhoneCall },
  { href: "/dashboard/tasks", label: "Task Manager", icon: ListChecks },
  { href: "/dashboard/vault", label: "Document Vault", icon: FolderLock },
  { href: "/dashboard/reports", label: "Reports & Metrics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-60 flex-col border-r border-border bg-surface">
      <Link href="/dashboard" className="flex items-center gap-2.5 px-5 py-5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft ring-1 ring-accent/40">
          <Zap className="h-4.5 w-4.5 text-accent-bright" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">
          DealFlow <span className="text-accent-bright">AI</span>
        </span>
      </Link>

      <nav className="mt-2 flex-1 space-y-0.5 px-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/dashboard" ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={`group flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] transition-colors ${
                active
                  ? "bg-accent-soft text-ink ring-1 ring-accent/30"
                  : "text-ink-dim hover:bg-card-hover hover:text-ink"
              }`}
            >
              <Icon className={`h-4 w-4 ${active ? "text-accent-bright" : "text-ink-faint group-hover:text-ink-dim"}`} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-border px-5 py-4">
        <p className="text-[11px] uppercase tracking-wider text-ink-faint">Tier 2 · Full Intelligence</p>
        <p className="mt-1 text-[13px] text-ink-dim">Demo Broker Account</p>
        <Link href="/admin" className="mt-2 block text-[12px] text-ink-faint hover:text-accent-bright">
          → Admin dashboard
        </Link>
      </div>
    </aside>
  );
}
