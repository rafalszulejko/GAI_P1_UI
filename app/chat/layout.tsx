'use client';

import { ProtectedRoute } from '@/components/auth/protected-route';
import Navbar from '@/components/Navbar';
import { useState } from 'react';
import { SidebarProvider } from '@/components/ui/sidebar';

export default function ChatLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mode, setMode] = useState<'chat' | 'settings'>('chat');

  const handleSwitchMode = () => {
    setMode(mode === 'chat' ? 'settings' : 'chat');
  };

  return (
    <ProtectedRoute>
      <SidebarProvider>
        <div className="flex flex-col h-screen w-full">
          <Navbar 
            onToggleSidebar={() => {}}
            mode={mode}
            onSwitchMode={handleSwitchMode}
            currentChannel=""
          />
          <div className="flex-1 overflow-hidden w-full">
            {children}
          </div>
        </div>
      </SidebarProvider>
    </ProtectedRoute>
  );
} 