"use client";

import { useEffect, useState } from "react";

const DEFAULT_SCRIPT = `Hi, may I speak with {{owner_first_name}}?

Hi {{owner_first_name}}, this is Ava calling on behalf of {{broker_name}}. We work with business owners in {{industry}} and our research suggested {{business_name}} might benefit from a complimentary, completely confidential business valuation — no obligation, and nothing to do with selling unless that's ever on your mind.

{{broker_name}} has {{value_prop}}. Would a quick 20-minute call this week or next work to walk through what your business might be worth in today's market?

[If yes] → offer 2-3 slots from calendar, book, confirm email + SMS.
[If callback requested] → capture specific date, log future_interest.
[If not interested] → thank them warmly, log with reason.
[If do-not-contact] → confirm removal, log DNC immediately.`;

const DEFAULT_EMAIL = `Subject: A confidential valuation for {{business_name}}

{{owner_first_name}} — most owners we meet have no idea what their business is actually worth in today's market. The attached guide covers what buyers in {{industry}} are paying right now.

If it's ever useful, my calendar link is below for a confidential, no-obligation conversation. No pressure — the guide is yours either way.

{{broker_signature}}
{{booking_link}}`;

export function ScriptEditor() {
  const [tab, setTab] = useState<"call" | "email">("call");
  const [call, setCall] = useState(DEFAULT_SCRIPT);
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const c = localStorage.getItem("df_script_call");
    const e = localStorage.getItem("df_script_email");
    if (c) setCall(c);
    if (e) setEmail(e);
  }, []);

  const save = () => {
    localStorage.setItem("df_script_call", call);
    localStorage.setItem("df_script_email", email);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <section className="card flex flex-col p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl font-medium">Scripts & Templates</h2>
        <div className="flex gap-1.5">
          {(["call", "email"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1.5 text-[12px] capitalize ${
                tab === t ? "bg-accent-soft text-ink ring-1 ring-accent/40" : "text-ink-dim ring-1 ring-border hover:text-ink"
              }`}
            >
              {t === "call" ? "AI call script" : "Warm email"}
            </button>
          ))}
        </div>
      </div>
      <p className="mt-1 text-[12px] text-ink-faint">
        Variables like {"{{owner_first_name}}"} fill automatically per lead. Changes apply to the next outreach run.
      </p>
      <textarea
        value={tab === "call" ? call : email}
        onChange={(e) => (tab === "call" ? setCall(e.target.value) : setEmail(e.target.value))}
        className="mt-3 h-72 w-full flex-1 rounded-lg border border-border bg-surface p-3 font-mono text-[12px] leading-relaxed text-ink outline-none focus:border-accent/50"
      />
      <div className="mt-3 flex items-center justify-end gap-3">
        {saved ? <span className="text-[12px] text-teal">Saved — applies on next run</span> : null}
        <button onClick={save} className="rounded-lg bg-accent px-4 py-2 text-[13px] font-medium text-white hover:bg-accent-bright">
          Save scripts
        </button>
      </div>
    </section>
  );
}
