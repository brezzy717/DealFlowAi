"use client";

import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { updateTenantSettings } from "@/app/dashboard/crm-actions";

function Toggle({
  label,
  desc,
  storageKey,
  defaultOn,
  onFlip,
}: {
  label: string;
  desc: string;
  storageKey: string;
  defaultOn: boolean;
  onFlip?: (on: boolean) => void;
}) {
  const [on, setOn] = useState(defaultOn);
  useEffect(() => {
    if (onFlip) return; // live-backed toggles trust the server value
    const s = localStorage.getItem(storageKey);
    if (s !== null) setOn(s === "1");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);
  const flip = () => {
    setOn((v) => {
      const next = !v;
      if (onFlip) onFlip(next);
      else localStorage.setItem(storageKey, next ? "1" : "0");
      return next;
    });
  };
  return (
    <div className="flex items-center justify-between gap-4 px-5 py-4">
      <div>
        <p className="text-[14px] font-medium">{label}</p>
        <p className="mt-0.5 text-[12px] text-ink-faint">{desc}</p>
      </div>
      <button
        onClick={flip}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-border-strong"}`}
        aria-checked={on}
        role="switch"
      >
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
      </button>
    </div>
  );
}

export function SettingsPanel({
  liveState,
}: {
  liveState?: { tier: 1 | 2; aiConcierge: boolean; pauseDrops: boolean } | null;
}) {
  const [tier, setTier] = useState<"1" | "2">(liveState ? String(liveState.tier) as "1" | "2" : "2");
  const [saved, setSaved] = useState<string | null>(null);
  useEffect(() => {
    if (liveState) return;
    const s = localStorage.getItem("df_tier");
    if (s === "1" || s === "2") setTier(s);
  }, [liveState]);

  const flash = (msg: string) => {
    setSaved(msg);
    setTimeout(() => setSaved(null), 3000);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <section className="card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="font-display text-xl font-medium">My Subscription</h2>
        </div>
        <div className="flex items-center justify-between gap-4 px-5 py-4">
          <div>
            <p className="text-[14px] font-medium">Change My Tier</p>
            <p className="mt-0.5 text-[12px] text-ink-faint">
              Billing prorates immediately. No refunds for partial months on cancellation.
            </p>
          </div>
          <div className="relative">
            <select
              value={tier}
              onChange={async (e) => {
                const next = e.target.value as "1" | "2";
                setTier(next);
                if (liveState) {
                  await updateTenantSettings({ tier: Number(next) as 1 | 2 });
                  flash("Tier updated — billing prorates on your next invoice");
                } else {
                  localStorage.setItem("df_tier", next);
                }
              }}
              className="appearance-none rounded-lg border border-border bg-card py-2 pl-3 pr-9 text-[13px] outline-none"
            >
              <option value="1">Tier 1 — Data Feed ($2,400/mo)</option>
              <option value="2">Tier 2 — Full Intelligence ($5,500/mo)</option>
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-2.5 h-4 w-4 text-ink-faint" />
          </div>
        </div>
        {saved ? <p className="px-5 pb-2 text-[12px] text-teal">{saved}</p> : null}
        <div className="divide-y divide-border border-t border-border">
          <Toggle
            label="AI Outreach Concierge"
            desc="Tier 2 feature. Full call + email cadence automation. Toggling off leaves initial warm email + postcard only."
            storageKey="df_ai_concierge"
            defaultOn={liveState ? liveState.aiConcierge : true}
            onFlip={
              liveState
                ? async (on) => {
                    await updateTenantSettings({ aiConcierge: on });
                    flash(on ? "AI Concierge enabled" : "AI Concierge disabled — initial email + postcard only");
                  }
                : undefined
            }
          />
          <Toggle
            label="Pause lead disbursements"
            desc="Skip the next 1–2 Tuesday drops. Your queue position is preserved."
            storageKey="df_pause_drops"
            defaultOn={liveState ? liveState.pauseDrops : false}
            onFlip={
              liveState
                ? async (on) => {
                    await updateTenantSettings({ pauseDrops: on });
                    flash(on ? "Drops paused for 14 days" : "Drops resumed — you're in the next Tuesday run");
                  }
                : undefined
            }
          />
        </div>
      </section>

      <section className="card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="font-display text-xl font-medium">Preferences</h2>
        </div>
        <div className="divide-y divide-border">
          <Toggle label="Dark mode" desc="Light theme ships with the Phase 3 polish pass." storageKey="df_dark" defaultOn />
          <Toggle label="Email notifications" desc="New drops, bookings, and rescore alerts." storageKey="df_notif_email" defaultOn />
          <Toggle label="SMS notifications" desc="Time-sensitive alerts only (bookings, Platinum rescores)." storageKey="df_notif_sms" defaultOn={false} />
        </div>
      </section>

      <section className="card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="font-display text-xl font-medium">Data & Account</h2>
        </div>
        <ul className="divide-y divide-border text-[13px]">
          {[
            ["Export all data", "Prospects, clients, appointments, call logs — CSV/JSON"],
            ["API keys", "Import/export your clients via API (docs included)"],
            ["How to use the platform", "Video guide + interactive dashboard tour replay"],
            ["Message admin", "Goes straight to the admin dashboard — 24h response"],
            ["Terminate subscription", "Access continues through the end of your billing cycle"],
          ].map(([label, desc]) => (
            <li key={label} className="flex cursor-pointer items-center justify-between px-5 py-3.5 transition hover:bg-card-hover">
              <div>
                <p className={label === "Terminate subscription" ? "font-medium text-danger" : "font-medium"}>{label}</p>
                <p className="mt-0.5 text-[12px] text-ink-faint">{desc}</p>
              </div>
              <span className="text-ink-faint">›</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
