"use client";

import { useRef, useState } from "react";
import { uploadVaultDoc, vaultDownloadUrl } from "@/app/dashboard/crm-actions";
import { Upload, Download } from "lucide-react";

export function VaultUploader() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const onPick = async (files: FileList | null) => {
    const file = files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg(null);
    const fd = new FormData();
    fd.set("file", file);
    const res = await uploadVaultDoc(fd);
    setBusy(false);
    setMsg(res.ok ? `Uploaded ${file.name}` : `Upload failed: ${res.error}`);
    if (res.ok) setTimeout(() => window.location.reload(), 800);
  };

  return (
    <div className="flex items-center gap-3">
      <input ref={inputRef} type="file" hidden onChange={(e) => onPick(e.target.files)} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex items-center gap-2 rounded-lg bg-accent px-3.5 py-2 text-[13px] font-medium text-white hover:bg-accent-bright disabled:opacity-50"
      >
        <Upload className="h-4 w-4" /> {busy ? "Uploading…" : "Upload document"}
      </button>
      {msg ? <span className="text-[12px] text-ink-dim">{msg}</span> : null}
    </div>
  );
}

export function VaultDownload({ docId }: { docId: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <button
      onClick={async () => {
        setBusy(true);
        const { url } = await vaultDownloadUrl(docId);
        setBusy(false);
        if (url) window.open(url, "_blank");
      }}
      disabled={busy}
      className="flex items-center gap-1 rounded border border-border bg-surface px-2.5 py-1 text-[11px] text-ink-dim hover:border-accent/40 hover:text-ink disabled:opacity-50"
    >
      <Download className="h-3 w-3" /> {busy ? "…" : "Download"}
    </button>
  );
}
