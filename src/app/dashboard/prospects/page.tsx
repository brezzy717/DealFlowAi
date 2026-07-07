import { Topbar } from "@/components/topbar";
import { ProspectTable } from "@/components/prospect-table";
import { getBrokerBook } from "@/lib/data/store";
import { Map } from "lucide-react";

export default function ProspectsPage() {
  const leads = getBrokerBook();

  return (
    <>
      <Topbar
        title="Prospects"
        subtitle="Your distributed leads, grouped by tier. Click any row for the full signal breakdown."
      />
      <main className="space-y-6 px-8 py-6">
        {/* Map panel — Mapbox wires in once the token is set */}
        <div className="card flex h-44 items-center justify-center border-dashed">
          <div className="text-center">
            <Map className="mx-auto h-6 w-6 text-ink-faint" />
            <p className="mt-2 text-[13px] text-ink-dim">
              Prospect map — color-coded pins by tier
            </p>
            <p className="text-[12px] text-ink-faint">
              Activates when <code className="font-mono">NEXT_PUBLIC_MAPBOX_TOKEN</code> is configured
            </p>
          </div>
        </div>

        <ProspectTable leads={leads} />
      </main>
    </>
  );
}
