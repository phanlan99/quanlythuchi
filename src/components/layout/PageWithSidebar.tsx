import type { ReactNode } from "react";
import { Sidebar, type SidebarProps } from "@/components/sidebar/Sidebar";
import { SyncBanner } from "./SyncBanner";

interface PageWithSidebarProps {
  children: ReactNode;
  /** Forwarded to <Sidebar>, so each page can customize its own sidebar. */
  sidebar?: SidebarProps;
}

/**
 * Opt-in wrapper: use it in any page that should show the sidebar.
 * The content area fills all remaining width on a plain neutral background.
 */
export function PageWithSidebar({ children, sidebar }: PageWithSidebarProps) {
  return (
    <div className="flex min-h-screen flex-1 flex-col md:flex-row">
      <Sidebar {...sidebar} />
      {/* No top padding: the sticky PageHeader provides the top spacing. */}
      <main className="min-w-0 flex-1 bg-zinc-50 px-4 pb-6 md:px-8 md:pb-8 dark:bg-black">
        <SyncBanner />
        {children}
      </main>
    </div>
  );
}
