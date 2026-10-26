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
    <div className="min-h-screen bg-[#11111F] font-sans text-[#F5F3FF] relative overflow-x-hidden selection:bg-[#9B7BFF]/30 selection:text-[#F5F3FF]">
      {/* Ambient Cyber Security Gradients behind glass cards */}
      <div className="fixed top-[-100px] left-[-80px] w-[550px] h-[550px] bg-[#8055F6]/08 rounded-full blur-[140px] pointer-events-none z-0 animate-float-blob-1" />
      <div className="fixed top-[20%] right-[-100px] w-[500px] h-[500px] bg-[#4DD9F0]/05 rounded-full blur-[130px] pointer-events-none z-0 animate-float-blob-2" />
      <div className="fixed bottom-[10%] left-[30%] w-[600px] h-[600px] bg-[#1D1D35]/50 rounded-full blur-[150px] pointer-events-none z-0 animate-float-blob-3" />
      <div className="fixed top-[60%] right-[15%] w-[450px] h-[450px] bg-[#9B7BFF]/06 rounded-full blur-[130px] pointer-events-none z-0 animate-float-slow" />

      {/* Toast Notifications */}
      <NotificationToastContainer />

      {/* Translucent Midnight Glass Animated Sidebar */}
      <Sidebar />

      {/* Main Content Area: dynamically transitions padding between 260px (pinned) and 68px (compact rail) */}
      <div
        className={`flex-1 flex flex-col min-w-0 relative z-10 transition-[padding-left] duration-200 ease-in-out ${
          isPinned ? 'lg:pl-[260px]' : 'lg:pl-[68px]'
        }`}
      >
        <Topbar title={pageTitle} onOpenMobileSidebar={() => setMobileOpen(true)} />

        <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-[1440px] w-full mx-auto space-y-8">
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
