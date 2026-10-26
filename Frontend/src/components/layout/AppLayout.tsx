import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { NotificationToastContainer } from '../dashboard/NotificationToast';
import { SidebarProvider, useSidebar } from '../ui/sidebar';

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

const LayoutInner: React.FC<AppLayoutProps> = ({ children, pageTitle }) => {
  const { isPinned, setMobileOpen } = useSidebar();

  return (
    <div className="fixed inset-0 overflow-hidden flex flex-col font-sans text-[#F5F3FF] selection:bg-[#9B7BFF]/30 selection:text-[#F5F3FF] bg-[#0A0A14]/20">
      {/* Toast Notifications */}
      <NotificationToastContainer />

      {/* Translucent Midnight Glass Animated Sidebar */}
      <Sidebar />

      {/* Main Content Area: dynamically transitions padding between 260px (pinned) and 68px (compact rail) */}
      <div
        className={`flex-1 flex flex-col min-w-0 min-h-0 h-full relative z-10 transition-[padding-left] duration-200 ease-in-out ${
          isPinned ? 'lg:pl-[260px]' : 'lg:pl-[68px]'
        }`}
      >
        <Topbar title={pageTitle} onOpenMobileSidebar={() => setMobileOpen(true)} />

        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-5 lg:p-6 max-w-[1440px] w-full mx-auto space-y-4 pb-12 scrollbar-thin">
          {children}
        </main>
      </div>
    </div>
  );
};

export const AppLayout: React.FC<AppLayoutProps> = (props) => {
  return (
    <SidebarProvider>
      <LayoutInner {...props} />
    </SidebarProvider>
  );
};
