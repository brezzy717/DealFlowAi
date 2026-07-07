import { Topbar } from "@/components/topbar";
import { getVaultDocs } from "@/lib/data/crm";
import { FileText, Upload, Paperclip } from "lucide-react";

export default function VaultPage() {
  const docs = getVaultDocs();
  return (
    <>
      <Topbar
        title="Document Vault"
        subtitle="Contracts, NDAs, LOIs, and the value-add attachments that ride on your outreach emails."
      />
      <main className="space-y-5 px-8 py-6">
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white hover:bg-accent-bright">
            <Upload className="h-4 w-4" /> Upload document
          </button>
          <p className="ml-auto text-[12px] text-ink-faint">
            Storage backed by Supabase Storage on connect · all docs importable/exportable
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {docs.map((d) => (
            <div key={d.id} className="card p-4 transition hover:bg-card-hover">
              <div className="flex items-start justify-between gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-soft ring-1 ring-accent/30">
                  <FileText className="h-4.5 w-4.5 text-accent-bright" />
                </span>
                {d.attachedToOutreach ? (
                  <span className="flex items-center gap-1 rounded bg-teal-soft px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal ring-1 ring-teal/30">
                    <Paperclip className="h-3 w-3" /> on warm email
                  </span>
                ) : null}
              </div>
              <p className="mt-3 text-[13px] font-medium leading-snug">{d.name}</p>
              <p className="mt-1 text-[11px] text-ink-faint">
                {d.type} · {d.sizeKb >= 1000 ? `${(d.sizeKb / 1000).toFixed(1)}MB` : `${d.sizeKb}KB`} · updated {d.updatedAt}
                {d.builtin ? " · platform template" : ""}
              </p>
              <div className="mt-3 flex gap-1.5">
                {["Edit", "Attach", "Download"].map((a) => (
                  <button key={a} className="rounded border border-border bg-surface px-2.5 py-1 text-[11px] text-ink-dim hover:border-accent/40 hover:text-ink">
                    {a}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
