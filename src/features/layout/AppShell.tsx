import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#080808] text-white flex flex-col md:flex-row antialiased overflow-x-hidden">
      {/* Smart Slim Sidebar (Desktop / TV) - On the LEFT */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col min-h-screen pb-24 md:pb-8 overflow-x-hidden">
        <Header />
        <main className="flex-1 min-w-0 w-full max-w-[1720px] mx-auto px-3 sm:px-6 md:px-8">
          {children}
        </main>
      </div>

      {/* Mobile Floating Bottom Nav Dock */}
      <BottomNav />
    </div>
  );
};
