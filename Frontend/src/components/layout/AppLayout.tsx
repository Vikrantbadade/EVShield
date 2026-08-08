import React, { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { NotificationToastContainer } from '../dashboard/NotificationToast';

interface AppLayoutProps {
  children: React.ReactNode;
  pageTitle: string;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children, pageTitle }) => {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen warm-bg-canvas font-sans text-[#3F3832] relative overflow-x-hidden">
      {/* Floating Multi-colored Gradient Blobs behind glass */}
      <div className="fixed top-[-100px] left-[-80px] w-[550px] h-[550px] bg-[#AD8B73]/16 rounded-full blur-[140px] pointer-events-none z-0 animate-float-blob-1" />
      <div className="fixed top-[20%] right-[-100px] w-[500px] h-[500px] bg-[#CEAB93]/20 rounded-full blur-[130px] pointer-events-none z-0 animate-float-blob-2" />
      <div className="fixed bottom-[10%] left-[30%] w-[600px] h-[600px] bg-[#E3CAA5]/22 rounded-full blur-[150px] pointer-events-none z-0 animate-float-blob-3" />
      <div className="fixed top-[60%] right-[15%] w-[450px] h-[450px] bg-[#19BFA3]/12 rounded-full blur-[130px] pointer-events-none z-0 animate-float-slow" />
      <div className="fixed bottom-[-50px] left-[-50px] w-[400px] h-[400px] bg-[#52A8FF]/10 rounded-full blur-[120px] pointer-events-none z-0 animate-float-slower" />

      {/* Toast Notifications */}
      <NotificationToastContainer />

      {/* Translucent Warm Glass Sidebar */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <div className="lg:pl-64 flex-1 flex flex-col min-w-0 relative z-10">
        <Topbar title={pageTitle} onOpenMobileSidebar={() => setMobileOpen(true)} />

        <main className="flex-1 p-5 sm:p-8 lg:p-10 max-w-[1440px] w-full mx-auto space-y-8 selection:bg-[#CEAB93]/30 selection:text-[#3F3832]">
          {children}
        </main>
      </div>
    </div>
  );
};
