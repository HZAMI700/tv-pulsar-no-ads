import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#000000] text-white flex flex-col md:flex-row overflow-x-hidden antialiased">
      {/* Smart Collapsible Sidebar (Desktop / TV) - On the LEFT */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen md:ml-20 pb-24 md:pb-8 transition-all">
        <Header />
        <main className="flex-1 w-full max-w-[1920px] mx-auto">{children}</main>
      </div>

      {/* Mobile Floating Bottom Nav Dock */}
      <BottomNav />
    </div>
  );
};
