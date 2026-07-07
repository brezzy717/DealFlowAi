"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@/lib/data/crm";
import { Send, FileText, CheckCircle2, Circle, Paperclip } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase/client";
import { openThread, sendMessage } from "@/app/dashboard/dealroom/actions";

interface Msg {
  id: string;
  sender: "broker" | "owner";
  body: string;
  at: string;
}

const SEED: Msg[] = [
  { id: "m1", sender: "owner", body: "Got the NDA — my attorney is reviewing it this week.", at: "2026-07-06T15:12:00Z" },
  { id: "m2", sender: "broker", body: "Perfect. Once that's signed I'll open up the financials checklist so we can start packaging the valuation.", at: "2026-07-06T15:20:00Z" },
  { id: "m3", sender: "owner", body: "Sounds good. Can we also talk about keeping this quiet from my staff until we're further along?", at: "2026-07-06T16:02:00Z" },
];

const DOC_CHECKLIST = [
  { name: "Mutual NDA", done: true },
  { name: "3 years P&L statements", done: false },
  { name: "3 years tax returns", done: false },
  { name: "Lease agreement", done: true },
  { name: "Equipment list w/ values", done: false },
];

export function DealRoom({ clients, live }: { clients: Client[]; live: boolean }) {
  const active = clients.filter((c) => c.status === "active_deal");
  const [selected, setSelected] = useState(0);
  const [msgs, setMsgs] = useState<Msg[]>(live ? [] : SEED);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const roomKey = active[selected]?.business ?? active[selected]?.name ?? "room";

  // Load thread history + subscribe to Supabase Realtime for the selected room
  useEffect(() => {
    if (!live || !active[selected]) return;
    let channel: ReturnType<ReturnType<typeof supabaseBrowser>["channel"]> | null = null;
    let cancelled = false;

    (async () => {
      const res = await openThread(roomKey);
      if (cancelled || !res) return;
      setThreadId(res.threadId);
      setMsgs(res.messages.map((m) => ({ id: m.id, sender: m.sender, body: m.body, at: m.created_at })));

      const supabase = supabaseBrowser();
      channel = supabase
        .channel(`dealroom:${res.threadId}`)
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "dealroom_messages", filter: `thread_id=eq.${res.threadId}` },
          (payload) => {
            const m = payload.new as { id: string; sender: "broker" | "owner"; body: string; created_at: string };
            setMsgs((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, { id: m.id, sender: m.sender, body: m.body, at: m.created_at }]));
          },
        )
        .subscribe();
    })();

    return () => {
      cancelled = true;
      if (channel) supabaseBrowser().removeChannel(channel);
    };
  }, [live, roomKey, selected, active]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  const send = useCallback(async () => {
    if (!draft.trim()) return;
    const body = draft.trim();
    setDraft("");
    if (live && threadId) {
      // Optimistic; the realtime INSERT will dedupe by id when it echoes back
      setMsgs((m) => [...m, { id: `local_${Date.now()}`, sender: "broker", body, at: new Date().toISOString() }]);
      await sendMessage(threadId, body);
    } else {
      setMsgs((m) => [...m, { id: `m_${Date.now()}`, sender: "broker", body, at: new Date().toISOString() }]);
    }
  }, [draft, live, threadId]);

  return (
    <div className="grid gap-5 lg:grid-cols-[240px_1fr_260px]">
      {/* Client list */}
      <div className="card overflow-hidden">
        <div className="border-b border-border px-4 py-3">
          <h2 className="text-[13px] font-semibold">Active rooms</h2>
        </div>
        <ul className="divide-y divide-border">
          {active.map((c, i) => (
            <li key={c.id}>
              <button
                onClick={() => setSelected(i)}
                className={`w-full px-4 py-3 text-left transition ${i === selected ? "bg-accent-soft/60" : "hover:bg-card-hover"}`}
              >
                <p className="truncate text-[13px] font-medium">{c.name}</p>
                <p className="truncate text-[11px] text-ink-faint">{c.business}</p>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Thread */}
      <div className="card flex h-[560px] flex-col">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-[14px] font-semibold">{active[selected]?.name}</h2>
          <p className="text-[11px] text-ink-faint">
            {active[selected]?.business} · end-to-end encrypted · realtime via Supabase on connect
          </p>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {msgs.map((m) => (
            <div key={m.id} className={`flex ${m.sender === "broker" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed ${
                  m.sender === "broker"
                    ? "rounded-br-sm bg-accent text-white"
                    : "rounded-bl-sm bg-surface text-ink ring-1 ring-border"
                }`}
              >
                {m.body}
                <p className={`mt-1 text-[10px] ${m.sender === "broker" ? "text-white/60" : "text-ink-faint"}`}>
                  {new Date(m.at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="flex items-center gap-2 border-t border-border p-3">
          <button className="rounded-lg border border-border p-2 text-ink-faint hover:text-ink">
            <Paperclip className="h-4 w-4" />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Message the owner… (they get an instant notification)"
            className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
          />
          <button onClick={send} className="rounded-lg bg-accent p-2 text-white hover:bg-accent-bright">
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Docs panel */}
      <div className="space-y-4">
        <div className="card">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-[13px] font-semibold">Document checklist</h2>
          </div>
          <ul className="divide-y divide-border">
            {DOC_CHECKLIST.map((d) => (
              <li key={d.name} className="flex items-center gap-2.5 px-4 py-2.5 text-[12px]">
                {d.done ? <CheckCircle2 className="h-4 w-4 shrink-0 text-teal" /> : <Circle className="h-4 w-4 shrink-0 text-ink-faint" />}
                <span className={d.done ? "text-ink-faint line-through" : "text-ink-dim"}>{d.name}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-4">
          <h2 className="flex items-center gap-2 text-[13px] font-semibold">
            <FileText className="h-4 w-4 text-accent-bright" /> In-app signing
          </h2>
          <p className="mt-2 text-[12px] leading-relaxed text-ink-faint">
            NDA signed by both parties Jul 6. Representation agreement queued — Dotted e-sign integration activates in
            Phase 3 wiring.
          </p>
          <button className="mt-3 w-full rounded-lg border border-border bg-surface py-2 text-[12px] text-ink-dim hover:border-accent/40 hover:text-ink">
            Request signature
          </button>
        </div>
      </div>
    </div>
  );
}
