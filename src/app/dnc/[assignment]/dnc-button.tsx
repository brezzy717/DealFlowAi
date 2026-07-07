"use client";

import { useState } from "react";
import { submitDnc } from "./actions";
import { Check } from "lucide-react";

export function DncButton({ assignmentId }: { assignmentId: string }) {
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");

  const go = async () => {
    setState("busy");
    await submitDnc(assignmentId);
    setState("done");
  };

  if (state === "done") {
    return (
      <div className="flex flex-col items-center gap-2 text-teal">
        <Check className="h-8 w-8" />
        <p className="text-[13px]">You&apos;ve been removed. You won&apos;t hear from us again.</p>
      </div>
    );
  }

  return (
    <button
      onClick={go}
      disabled={state === "busy"}
      className="w-full rounded-lg bg-danger py-2.5 text-[14px] font-medium text-white hover:opacity-90 disabled:opacity-50"
    >
      {state === "busy" ? "Removing…" : "Do not contact me again"}
    </button>
  );
}
