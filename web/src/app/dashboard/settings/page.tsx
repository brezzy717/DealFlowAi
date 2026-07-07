import { Topbar } from "@/components/topbar";
import { SettingsPanel } from "@/components/settings-panel";

export default function SettingsPage() {
  return (
    <>
      <Topbar title="Settings" subtitle="Subscription, AI concierge, notifications, and account controls." />
      <main className="px-8 py-6">
        <SettingsPanel />
      </main>
    </>
  );
}
