"use client";

import { useEffect, useRef, useState } from "react";
import { Sparkles, X, Send } from "lucide-react";

interface Msg {
  role: "user" | "assistant";
  content: string;
}

export function AvaWidget() {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([
    { role: "assistant", content: "Hey — I'm Ava, your Deal Assist. Ask me about your leads, your numbers, or tell me to draft something." },
  ]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs, open]);

  const send = async () => {
    const q = draft.trim();
    if (!q || busy) return;
    const next: Msg[] = [...msgs, { role: "user" as const, content: q }];
    setMsgs(next);
    setDraft("");
    setBusy(true);
    try {
      const res = await fetch("/api/ava", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next.filter((m, i) => i > 0 || m.role === "user") }),
      });
      const data = await res.json();
      setMsgs((m) => [...m, { role: "assistant", content: data.reply ?? "Hmm, no answer came back." }]);
    } catch {
      setMsgs((m) => [...m, { role: "assistant", content: "Connection hiccup — try that again." }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {open ? (
        <div className="fixed bottom-24 right-6 z-40 flex h-[480px] w-96 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
          <div className="flex items-center justify-between border-b border-border bg-surface px-4 py-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-accent-bright" />
              <span className="text-[13px] font-semibold">Ava · Deal Assist</span>
            </div>
            <button onClick={() => setOpen(false)} className="text-ink-faint hover:text-ink">
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {msgs.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-[13px] leading-relaxed ${
                    m.role === "user" ? "rounded-br-sm bg-accent text-white" : "rounded-bl-sm bg-surface ring-1 ring-border"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {busy ? <p className="text-[12px] text-ink-faint">Ava is thinking…</p> : null}
            <div ref={bottomRef} />
          </div>
          <div className="flex items-center gap-2 border-t border-border p-3">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask Ava anything…"
              className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
            />
            <button onClick={send} disabled={busy} className="rounded-lg bg-accent p-2 text-white hover:bg-accent-bright disabled:opacity-50">
              <Send className="h-4 w-4" />
            </button>
          </div>
        </div>
      ) : null}
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-accent px-4 py-3 text-[13px] font-medium text-white shadow-lg shadow-accent/25 transition hover:bg-accent-bright"
      >
        <Sparkles className="h-4 w-4" />
        Ask Ava
      </button>
    </>
  );
}
