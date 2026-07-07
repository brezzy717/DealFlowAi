"use client";

import { useState } from "react";
import { Link2, Check } from "lucide-react";

export function BookingLinkButton({ tenantId }: { tenantId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    const url = `${window.location.origin}/book/${tenantId}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };
  return (
    <button
      onClick={copy}
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-[13px] text-ink-dim hover:text-ink"
    >
      {copied ? <Check className="h-4 w-4 text-teal" /> : <Link2 className="h-4 w-4" />}
      {copied ? "Copied!" : "Copy my booking link"}
    </button>
  );
}
