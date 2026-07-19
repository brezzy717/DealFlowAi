import { Topbar } from "@/components/topbar";
import { SettingsPanel } from "@/components/settings-panel";
import { getLiveTenant } from "@/lib/data/live";
import { supabaseAdmin } from "@/lib/supabase/admin";

export default async function SettingsPage() {
  const tenant = await getLiveTenant();
  let liveState: { tier: 1 | 2; aiConcierge: boolean; pauseDrops: boolean } | null = null;
  if (tenant) {
    const admin = supabaseAdmin();
    const { data } = await admin
      .from("tenants")
      .select("tier, ai_calling_concierge_enabled, pause_drops_until")
      .eq("id", tenant.tenantId)
      .maybeSingle();
    if (data) {
      liveState = {
        tier: (data.tier ?? 2) as 1 | 2,
        aiConcierge: Boolean(data.ai_calling_concierge_enabled),
        pauseDrops: Boolean(data.pause_drops_until && data.pause_drops_until >= new Date().toISOString().slice(0, 10)),
      };
    }
  }
  return (
    <>
      <Topbar title="Settings" subtitle="Subscription, AI concierge, notifications, and account controls." />
      <main className="px-8 py-6">
        <SettingsPanel liveState={liveState} />
      </main>
    </>
  );
}
