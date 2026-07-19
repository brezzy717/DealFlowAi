import { Topbar } from "@/components/topbar";
import { getClients } from "@/lib/data/crm";
import { getLiveTenant, getLiveClients } from "@/lib/data/live";
import { Upload, Download, UserPlus } from "lucide-react";

const STATUS: Record<string, { label: string; cls: string }> = {
  active_deal: { label: "Active deal", cls: "bg-accent-soft text-accent-bright ring-accent/30" },
  closed: { label: "Closed", cls: "bg-teal-soft text-teal ring-teal/30" },
  nurture: { label: "Nurture", cls: "bg-surface text-ink-dim ring-border" },
};

export default async function ClientsPage() {
  const tenant = await getLiveTenant();
  const liveClients = tenant ? await getLiveClients(tenant.tenantId) : null;
  const clients = liveClients ?? getClients();
  return (
    <>
      <Topbar
        title="My Clients"
        subtitle={
          liveClients
            ? "Live: prospects you've booked or moved into the pipeline. CSV/API import lands next."
            : "Converted prospects and imported contacts. Closed deals archive here for later follow-up."
        }
      />
      <main className="space-y-5 px-8 py-6">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white hover:bg-accent-bright">
            <UserPlus className="h-4 w-4" /> Add client
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-[13px] text-ink-dim hover:text-ink">
            <Upload className="h-4 w-4" /> Import CSV / Google
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-[13px] text-ink-dim hover:text-ink">
            <Download className="h-4 w-4" /> Export all
          </button>
          <p className="ml-auto text-[12px] text-ink-faint">{clients.length} contacts · API import available in Settings</p>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-left text-[13px]">
            <thead className="border-b border-border bg-surface/60 text-[11px] uppercase tracking-wider text-ink-faint">
              <tr>
                <th className="px-5 py-3 font-medium">Client</th>
                <th className="px-5 py-3 font-medium">Business</th>
                <th className="hidden px-5 py-3 font-medium lg:table-cell">Contact</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Source</th>
                <th className="hidden px-5 py-3 font-medium md:table-cell">Since</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {clients.map((c) => (
                <tr key={c.id} className="transition hover:bg-card-hover">
                  <td className="px-5 py-3.5 font-medium">{c.name}</td>
                  <td className="px-5 py-3.5 text-ink-dim">{c.business}</td>
                  <td className="hidden px-5 py-3.5 text-ink-faint lg:table-cell">
                    {c.email}
                    <span className="ml-2">{c.phone}</span>
                  </td>
                  <td className="hidden px-5 py-3.5 capitalize text-ink-dim md:table-cell">{c.source}</td>
                  <td className="hidden px-5 py-3.5 text-ink-faint md:table-cell">
                    {new Date(c.since).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`rounded px-2 py-0.5 text-[11px] font-medium ring-1 ${STATUS[c.status].cls}`}>
                      {STATUS[c.status].label}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </>
  );
}
