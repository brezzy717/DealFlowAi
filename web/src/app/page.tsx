import Link from "next/link";
import { Zap, ArrowRight, Radar, Brain, PhoneCall } from "lucide-react";

export default function Home() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-accent/10 blur-3xl" />

      <header className="relative z-10 flex items-center justify-between px-8 py-6 lg:px-16">
        <div className="flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft ring-1 ring-accent/40">
            <Zap className="h-4.5 w-4.5 text-accent-bright" />
          </span>
          <span className="text-[15px] font-semibold tracking-tight">
            DealFlow <span className="text-accent-bright">AI</span>
          </span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/dashboard" className="rounded-lg px-4 py-2 text-[13px] text-ink-dim hover:text-ink">
            Sign in
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-white transition hover:bg-accent-bright"
          >
            Get started
          </Link>
        </nav>
      </header>

      <main className="relative z-10 mx-auto max-w-4xl px-8 pt-20 text-center lg:pt-28">
        <p className="mx-auto w-fit rounded-full border border-border bg-card px-4 py-1.5 text-[12px] uppercase tracking-widest text-ink-dim">
          Off-market deal intelligence for business brokers
        </p>
        <h1 className="mt-6 text-5xl font-semibold leading-[1.08] tracking-tight lg:text-6xl">
          Find owners ready to sell —{" "}
          <span className="bg-gradient-to-r from-accent-bright to-platinum bg-clip-text text-transparent">
            before they know it themselves.
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-[16px] leading-relaxed text-ink-dim">
          DealFlow AI reads distress and succession signals across a dozen data sources — court filings, liens,
          foreclosures, workforce trends, reputation decay — scores every business, and drops qualified off-market
          leads on your dashboard every Tuesday at 6 AM. Your AI concierge handles the outreach.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 rounded-lg bg-accent px-6 py-3 text-[14px] font-medium text-white transition hover:bg-accent-bright"
          >
            View the live demo <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-20 grid gap-4 pb-24 text-left sm:grid-cols-3">
          {[
            {
              icon: Radar,
              title: "55+ weighted signals",
              body: "Succession risk, life events, financial distress, and operational decay — decayed by recency, multiplied when they stack.",
            },
            {
              icon: Brain,
              title: "Explained, not just scored",
              body: "Every lead arrives with plain-English reasoning a broker can use on the first call.",
            },
            {
              icon: PhoneCall,
              title: "AI concierge outreach",
              body: "Warm emails, USPS postcards, and AI calls that book qualified owners straight onto your calendar.",
            },
          ].map(({ icon: Icon, title, body }) => (
            <div key={title} className="card p-5">
              <Icon className="h-5 w-5 text-accent-bright" />
              <h3 className="mt-3 text-[14px] font-semibold">{title}</h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-ink-dim">{body}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
