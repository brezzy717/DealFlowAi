import { DncButton } from "./dnc-button";
import { Zap } from "lucide-react";

export default async function DncPage({ params }: { params: Promise<{ assignment: string }> }) {
  const { assignment } = await params;
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="card w-full max-w-md p-7 text-center">
        <div className="mx-auto flex items-center justify-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft ring-1 ring-accent/40">
            <Zap className="h-4.5 w-4.5 text-accent-bright" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            DealFlow <span className="text-accent-bright">AI</span>
          </span>
        </div>
        <h1 className="mt-5 font-display text-2xl font-medium">Manage your contact preferences</h1>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-dim">
          If you&apos;d prefer not to be contacted again, one click removes you permanently. We&apos;ll keep a
          suppression record for compliance and never reach out again.
        </p>
        <div className="mt-6">
          <DncButton assignmentId={assignment} />
        </div>
      </div>
    </div>
  );
}
