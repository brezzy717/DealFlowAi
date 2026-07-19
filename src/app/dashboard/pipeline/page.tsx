import { Topbar } from "@/components/topbar";
import { PipelineBoard } from "@/components/pipeline-board";
import { getDeals } from "@/lib/data/crm";
import { getLiveTenant, getLiveDeals } from "@/lib/data/live";

export default async function PipelinePage() {
  const tenant = await getLiveTenant();
  const liveDeals = tenant ? await getLiveDeals(tenant.tenantId) : null;
  const deals = liveDeals ?? getDeals();
  const total = deals.reduce((a, d) => a + d.estValue, 0);
  return (
    <>
      <Topbar
        title="Active Deals"
        subtitle={`${deals.length} deals · $${(total / 1_000_000).toFixed(2)}M in pipeline · drag cards between stages${
          liveDeals ? "" : tenant ? " · use 'Move to Pipeline' on a prospect to start a live deal" : " · demo data"
        }`}
      />
      <main className="px-8 py-6">
        <PipelineBoard initial={deals} live={Boolean(liveDeals)} />
      </main>
    </>
  );
}
