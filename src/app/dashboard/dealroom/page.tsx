import { Topbar } from "@/components/topbar";
import { DealRoom } from "@/components/dealroom";
import { getClients } from "@/lib/data/crm";

export default function DealRoomPage() {
  return (
    <>
      <Topbar
        title="Deal Room"
        subtitle="Secure broker–owner messaging, document exchange, and in-app signing. Owners get instant responses."
      />
      <main className="px-8 py-6">
        <DealRoom clients={getClients()} />
      </main>
    </>
  );
}
