"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Zap } from "lucide-react";

const STEPS = ["Choose Tier", "Payment", "Lead Parameters", "AI Concierge Agreement", "Done"];

const INDUSTRIES = ["Restaurants / Food Service", "Retail", "Construction & Trades", "Manufacturing", "Healthcare / Dental", "Transportation & Logistics", "Professional Services", "Fitness & Wellness"];

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [tier, setTier] = useState<1 | 2>(2);
  const [params, setParams] = useState({ geo: "", revMin: "", revMax: "", empMin: "", years: "", exclude: [] as string[] });
  const [signature, setSignature] = useState("");
  const [agreed, setAgreed] = useState(false);

  const canContinue =
    step === 2 ? params.geo.trim().length > 0 : step === 3 ? agreed && signature.trim().length > 2 : true;

  const next = () => {
    if (step === 3) {
      localStorage.setItem(
        "df_onboarding",
        JSON.stringify({ tier, params, signature, signedAt: new Date().toISOString() }),
      );
    }
    setStep((s) => Math.min(s + 1, 4));
  };

  return (
    <div className="mx-auto max-w-2xl px-6 py-10">
      <div className="mb-8 flex items-center gap-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent-soft ring-1 ring-accent/40">
          <Zap className="h-4.5 w-4.5 text-accent-bright" />
        </span>
        <span className="text-[15px] font-semibold tracking-tight">
          DealFlow <span className="text-accent-bright">AI</span> — Broker Onboarding
        </span>
      </div>

      {/* Stepper */}
      <ol className="mb-8 flex items-center gap-2">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col gap-1.5">
            <span className={`h-1 rounded-full ${i <= step ? "bg-accent" : "bg-border"}`} />
            <span className={`text-[11px] ${i === step ? "text-ink" : "text-ink-faint"}`}>{s}</span>
          </li>
        ))}
      </ol>

      <div className="card p-6">
        {step === 0 ? (
          <div>
            <h1 className="font-display text-3xl font-medium">Choose your subscription</h1>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              {[
                { n: 1 as const, name: "Data Feed", setup: "$6,500 setup", mo: "$2,400/mo", pts: ["60 scored off-market leads/mo", "Warm email + USPS postcard first touch", "Full CRM dashboard, vault, reports", "You handle follow-up + outcome actions"] },
                { n: 2 as const, name: "Full Intelligence", setup: "$8,500 setup", mo: "$5,500/mo", pts: ["Everything in Tier 1", "AI voice concierge: full call cadence", "Psychological profiling on every call", "Bookings land on your calendar automatically"] },
              ].map((t) => (
                <button
                  key={t.n}
                  onClick={() => setTier(t.n)}
                  className={`rounded-xl border p-4 text-left transition ${
                    tier === t.n ? "border-accent/60 bg-accent-soft/50 ring-1 ring-accent/40" : "border-border bg-surface hover:bg-card-hover"
                  }`}
                >
                  <p className="text-[12px] uppercase tracking-wider text-ink-faint">Tier {t.n}</p>
                  <p className="mt-1 font-display text-2xl font-medium">{t.name}</p>
                  <p className="mt-1 text-[13px] text-accent-bright">
                    {t.setup} · <span className="font-semibold">{t.mo}</span>
                  </p>
                  <ul className="mt-3 space-y-1.5">
                    {t.pts.map((p) => (
                      <li key={p} className="flex gap-2 text-[12px] text-ink-dim">
                        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-teal" /> {p}
                      </li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div>
            <h1 className="font-display text-3xl font-medium">Payment</h1>
            <p className="mt-2 text-[13px] text-ink-dim">
              Tier {tier} — {tier === 2 ? "$8,500 setup + $5,500/mo" : "$6,500 setup + $2,400/mo"}. Billing cycle starts
              today and runs 30 days. Invoice option available (reminder 5 days before due).
            </p>
            <div className="mt-5 space-y-3 rounded-xl border border-dashed border-border-strong bg-surface p-5">
              <input placeholder="Card number" className="w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[13px] outline-none placeholder:text-ink-faint" />
              <div className="grid grid-cols-2 gap-3">
                <input placeholder="MM / YY" className="rounded-lg border border-border bg-card px-3 py-2.5 text-[13px] outline-none placeholder:text-ink-faint" />
                <input placeholder="CVC" className="rounded-lg border border-border bg-card px-3 py-2.5 text-[13px] outline-none placeholder:text-ink-faint" />
              </div>
              <p className="text-[11px] text-ink-faint">
                Stripe Checkout takes over this step when <code className="font-mono">STRIPE_SECRET_KEY</code> is configured —
                this form is a stand-in and stores nothing.
              </p>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div>
            <h1 className="font-display text-3xl font-medium">Lead parameters</h1>
            <p className="mt-2 text-[13px] text-ink-dim">Your weekly drops only include businesses matching these filters. At least one filter is required.</p>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="text-[12px] text-ink-dim">Geography (cities, states, or zips — comma separated)</span>
                <input
                  value={params.geo}
                  onChange={(e) => setParams({ ...params, geo: e.target.value })}
                  placeholder="e.g. Greater Phoenix, Scottsdale, 85251"
                  className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[13px] outline-none placeholder:text-ink-faint focus:border-accent/50"
                />
              </label>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  ["Revenue min ($)", "revMin", "2000000"],
                  ["Revenue max ($)", "revMax", ""],
                  ["Min employees", "empMin", "3"],
                  ["Min yrs in biz", "years", "5"],
                ].map(([label, key, ph]) => (
                  <label key={key} className="block">
                    <span className="text-[12px] text-ink-dim">{label}</span>
                    <input
                      value={params[key as "revMin"]}
                      onChange={(e) => setParams({ ...params, [key]: e.target.value })}
                      placeholder={ph}
                      className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2.5 text-[13px] outline-none placeholder:text-ink-faint focus:border-accent/50"
                    />
                  </label>
                ))}
              </div>
              <div>
                <span className="text-[12px] text-ink-dim">Exclude industries</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {INDUSTRIES.map((ind) => {
                    const on = params.exclude.includes(ind);
                    return (
                      <button
                        key={ind}
                        onClick={() =>
                          setParams({ ...params, exclude: on ? params.exclude.filter((x) => x !== ind) : [...params.exclude, ind] })
                        }
                        className={`rounded-full px-3 py-1.5 text-[12px] ring-1 transition ${
                          on ? "bg-danger/10 text-danger ring-danger/30" : "text-ink-dim ring-border hover:text-ink"
                        }`}
                      >
                        {on ? "✕ " : ""}{ind}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div>
            <h1 className="font-display text-3xl font-medium">AI Concierge & feedback agreement</h1>
            <div className="mt-4 max-h-56 overflow-y-auto rounded-lg border border-border bg-surface p-4 text-[12px] leading-relaxed text-ink-dim">
              <p>
                The AI Calling Concierge automates your lead follow-up: warm email + postcards on Day 1, then (Tier 2)
                the full call/email cadence until contact is made or the lead requests no further contact. Every call is
                recorded, transcribed, and attached to the lead. Bookings auto-confirm to all parties.
              </p>
              <p className="mt-3">
                I have read the terms associated with my subscription and understand that I am responsible for all
                Outcome Feedback Actions, as these directly impact model training and are required for optimal lead
                quality. Any breach shall constitute misuse, and Aligned Enterprises dba DealFlow AI (their
                beneficiaries, successors and assigns) may at their discretion terminate this subscription without prior
                notice and with no obligation to renew.
              </p>
            </div>
            <label className="mt-4 flex items-start gap-3">
              <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#c25e40]" />
              <span className="text-[13px] text-ink-dim">I agree to abide by the outcome-feedback requirement for use of this product.</span>
            </label>
            <input
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              placeholder="Type your full legal name as signature"
              className="mt-3 w-full rounded-lg border border-border bg-card px-3 py-2.5 font-display text-xl outline-none placeholder:font-sans placeholder:text-[13px] placeholder:text-ink-faint focus:border-accent/50"
            />
          </div>
        ) : null}

        {step === 4 ? (
          <div className="py-6 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-teal-soft ring-1 ring-teal/40">
              <Check className="h-7 w-7 text-teal" />
            </span>
            <h1 className="mt-4 font-display text-3xl font-medium">Your dashboard is ready</h1>
            <p className="mt-2 text-[13px] text-ink-dim">
              First lead drop: <span className="text-ink">Tuesday, July 14 at 6:00 AM</span>. The interactive tour starts
              on your first login.
            </p>
            <Link
              href="/dashboard"
              className="mt-6 inline-block rounded-lg bg-accent px-6 py-3 text-[14px] font-medium text-white hover:bg-accent-bright"
            >
              Explore Your Dashboard
            </Link>
          </div>
        ) : null}

        {step < 4 ? (
          <div className="mt-6 flex justify-between border-t border-border pt-5">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="rounded-lg border border-border px-4 py-2 text-[13px] text-ink-dim disabled:opacity-40">
              Back
            </button>
            <button onClick={next} disabled={!canContinue} className="rounded-lg bg-accent px-5 py-2 text-[13px] font-medium text-white hover:bg-accent-bright disabled:opacity-40">
              {step === 3 ? "Sign & finish" : "Continue"}
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
