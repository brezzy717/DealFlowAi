import { Sidebar } from "@/components/sidebar";
import { AvaWidget } from "@/components/ava-widget";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <Sidebar />
      <div className="pl-60">{children}</div>
      <AvaWidget />
    </div>
  );
}
