import { Topbar } from "@/components/topbar";
import { PipelineBoard } from "@/components/pipeline-board";
import { getDeals } from "@/lib/data/crm";

export default function PipelinePage() {
  const deals = getDeals();
  const total = deals.reduce((a, d) => a + d.estValue, 0);
  return (
    <>
      <Topbar
        title="Active Deals"
        subtitle={`${deals.length} deals · $${(total / 1_000_000).toFixed(2)}M in pipeline · drag cards between stages`}
      />
      <main className="px-8 py-6">
        <PipelineBoard initial={deals} />
      </main>
    </>
  );
}
