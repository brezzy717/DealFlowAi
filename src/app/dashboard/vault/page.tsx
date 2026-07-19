import { Topbar } from "@/components/topbar";
import { getVaultDocs, VaultDoc } from "@/lib/data/crm";
import { getLiveTenant } from "@/lib/data/live";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { VaultUploader, VaultDownload } from "@/components/vault-uploader";
import { FileText, Paperclip } from "lucide-react";

export default async function VaultPage() {
  const tenant = await getLiveTenant();
  let uploaded: VaultDoc[] = [];
  if (tenant) {
    const admin = supabaseAdmin();
    const { data } = await admin
      .from("vault_documents")
      .select("id, name, mime_type, size_kb, updated_at, builtin, attached_to_outreach")
      .eq("tenant_id", tenant.tenantId)
      .order("updated_at", { ascending: false });
    uploaded = (data ?? []).map((d) => ({
      id: d.id,
      name: d.name,
      type: d.mime_type?.split("/")[1]?.toUpperCase() ?? "FILE",
      sizeKb: d.size_kb ?? 0,
      updatedAt: new Date(d.updated_at).toISOString().slice(0, 10),
      builtin: Boolean(d.builtin),
      attachedToOutreach: Boolean(d.attached_to_outreach),
    }));
  }
  const docs = [...uploaded, ...getVaultDocs()];

  return (
    <>
      <Topbar
        title="Document Vault"
        subtitle="Contracts, NDAs, LOIs, and the value-add attachments that ride on your outreach emails."
      />
      <main className="space-y-5 px-8 py-6">
        <div className="flex items-center gap-2">
          {tenant ? (
            <VaultUploader />
          ) : (
            <p className="text-[13px] text-ink-dim">Sign in to upload your own documents.</p>
          )}
          <p className="ml-auto text-[12px] text-ink-faint">
            Private Supabase Storage · uploads live in your tenant folder only
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
                {!d.builtin && tenant ? (
                  <VaultDownload docId={d.id} />
                ) : (
                  <button className="rounded border border-border bg-surface px-2.5 py-1 text-[11px] text-ink-dim hover:border-accent/40 hover:text-ink">
                    Download
                  </button>
                )}
                <button className="rounded border border-border bg-surface px-2.5 py-1 text-[11px] text-ink-dim hover:border-accent/40 hover:text-ink">
                  Attach
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
