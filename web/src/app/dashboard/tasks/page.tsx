import { Topbar } from "@/components/topbar";
import { TaskList } from "@/components/task-list";
import { getTasks } from "@/lib/data/crm";

export default function TasksPage() {
  const tasks = getTasks();
  const outstanding = tasks.filter((t) => t.kind === "action_outreach" && !t.done).length;
  return (
    <>
      <Topbar
        title="Task Manager"
        subtitle={`${outstanding} outreach outcomes still need actioning — these train the scoring model.`}
      />
      <main className="mx-auto max-w-3xl px-8 py-6">
        <TaskList initial={tasks} />
      </main>
    </>
  );
}
