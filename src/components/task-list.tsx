"use client";

import { useEffect, useState } from "react";
import { TaskItem } from "@/lib/data/crm";
import { addTask, setTaskDone, removeTask } from "@/app/dashboard/crm-actions";
import { CheckCircle2, Circle, Plus, PhoneCall, FileText, Bell, ListTodo, Trash2 } from "lucide-react";

const KIND_ICON = { action_outreach: PhoneCall, document: FileText, reminder: Bell, todo: ListTodo };
const KIND_LABEL = { action_outreach: "Action outreach", document: "Document", reminder: "Reminder", todo: "To-do" };

export function TaskList({ initial, live = false }: { initial: TaskItem[]; live?: boolean }) {
  const [tasks, setTasks] = useState<TaskItem[]>(initial);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    if (live) return;
    const saved = localStorage.getItem("df_tasks");
    if (saved) {
      const overrides: { added: TaskItem[]; done: string[]; removed: string[] } = JSON.parse(saved);
      setTasks((ts) => [
        ...ts.filter((t) => !overrides.removed.includes(t.id)).map((t) => (overrides.done.includes(t.id) ? { ...t, done: true } : t)),
        ...overrides.added,
      ]);
    }
  }, [live]);

  const persist = (next: TaskItem[]) => {
    if (!live) {
      const initialIds = new Set(initial.map((t) => t.id));
      localStorage.setItem(
        "df_tasks",
        JSON.stringify({
          added: next.filter((t) => !initialIds.has(t.id)),
          done: next.filter((t) => t.done && initialIds.has(t.id)).map((t) => t.id),
          removed: initial.filter((t) => !next.some((n) => n.id === t.id)).map((t) => t.id),
        }),
      );
    }
    setTasks(next);
  };

  const toggle = (id: string) => {
    const t = tasks.find((x) => x.id === id);
    persist(tasks.map((x) => (x.id === id ? { ...x, done: !x.done } : x)));
    // Auto outreach tasks resolve via the Action buttons on the lead, not here
    if (live && t && !id.startsWith("auto_")) setTaskDone(id, !t.done);
  };
  const remove = (id: string) => {
    persist(tasks.filter((t) => t.id !== id));
    if (live && !id.startsWith("auto_")) removeTask(id);
  };
  const add = async () => {
    if (!draft.trim()) return;
    const title = draft.trim();
    setDraft("");
    if (live) {
      const res = await addTask(title);
      persist([...tasks, { id: res.id ?? `t_${Date.now()}`, title, kind: "todo", due: new Date().toISOString(), done: false }]);
    } else {
      persist([...tasks, { id: `t_${Date.now()}`, title, kind: "todo", due: new Date().toISOString(), done: false }]);
    }
  };

  const open = tasks.filter((t) => !t.done);
  const closed = tasks.filter((t) => t.done);

  return (
    <div className="space-y-5">
      <div className="card flex items-center gap-2 p-3">
        <Plus className="h-4 w-4 text-ink-faint" />
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task and press Enter…"
          className="flex-1 bg-transparent text-[13px] outline-none placeholder:text-ink-faint"
        />
        <button onClick={add} className="rounded-md bg-accent px-3 py-1.5 text-[12px] font-medium text-white hover:bg-accent-bright">
          Add
        </button>
      </div>

      <section className="card">
        <div className="border-b border-border px-5 py-3.5">
          <h2 className="font-display text-xl font-medium">Open ({open.length})</h2>
        </div>
        <ul className="divide-y divide-border">
          {open.map((t) => {
            const Icon = KIND_ICON[t.kind];
            return (
              <li key={t.id} className="group flex items-center gap-3 px-5 py-3">
                <button onClick={() => toggle(t.id)} className="text-ink-faint hover:text-teal">
                  <Circle className="h-4.5 w-4.5" />
                </button>
                <Icon className={`h-4 w-4 ${t.kind === "action_outreach" ? "text-warning" : "text-ink-faint"}`} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px]">{t.title}</p>
                  <p className="text-[11px] text-ink-faint">
                    {KIND_LABEL[t.kind]} · due {new Date(t.due).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                    {t.kind === "action_outreach" ? " · feeds the ML feedback loop" : ""}
                  </p>
                </div>
                <button onClick={() => remove(t.id)} className="invisible text-ink-faint hover:text-danger group-hover:visible">
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            );
          })}
          {open.length === 0 ? <li className="px-5 py-6 text-center text-[13px] text-ink-faint">All caught up.</li> : null}
        </ul>
      </section>

      {closed.length > 0 ? (
        <section className="card opacity-70">
          <div className="border-b border-border px-5 py-3.5">
            <h2 className="font-display text-xl font-medium">Done ({closed.length})</h2>
          </div>
          <ul className="divide-y divide-border">
            {closed.map((t) => (
              <li key={t.id} className="flex items-center gap-3 px-5 py-3">
                <button onClick={() => toggle(t.id)} className="text-teal">
                  <CheckCircle2 className="h-4.5 w-4.5" />
                </button>
                <p className="flex-1 text-[13px] text-ink-faint line-through">{t.title}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
