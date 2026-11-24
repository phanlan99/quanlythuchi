import { PageWithSidebar } from "@/components/layout/PageWithSidebar";
import { DashboardView } from "@/components/dashboard/DashboardView";

export default function HomePage() {
  return (
    <PageWithSidebar>
      <DashboardView />
    </PageWithSidebar>
  );
}
