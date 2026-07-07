import { Topbar } from "@/components/topbar";
import { DealRoom } from "@/components/dealroom";
import { getClients } from "@/lib/data/crm";
import { getLiveTenant, getLiveClients } from "@/lib/data/live";

export default async function DealRoomPage() {
  const tenant = await getLiveTenant();
  const liveClients = tenant ? await getLiveClients(tenant.tenantId) : null;
  const clients = liveClients ?? getClients();

  return (
    <>
      <Topbar
        title="Deal Room"
        subtitle="Secure broker–owner messaging, document exchange, and in-app signing. Owners get instant responses."
      />
      <main className="px-8 py-6">
        <DealRoom clients={clients} live={Boolean(liveClients)} />
      </main>
    </>
  );
}
