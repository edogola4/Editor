import React, { useCallback, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ChatPanel } from './ChatPanel';
import { useChat } from '@/contexts/ChatContext';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';

export function ChatContainer() {
  const { isChatOpen, isMinimized, closeChat, minimizeChat, maximizeChat } = useChat();
  const panelRef = useRef<HTMLDivElement>(null);

  // Close chat when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        closeChat();
      }
    };

    if (isChatOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isChatOpen, closeChat]);

  // Handle keyboard shortcut to toggle chat (Ctrl+Shift+C)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'C') {
        e.preventDefault();
        if (isChatOpen) {
          closeChat();
        } else {
          maximizeChat();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isChatOpen, closeChat, maximizeChat]);

  if (!isChatOpen) return null;

  return (
    <div
      ref={panelRef}
      className={cn(
        'fixed bottom-4 right-4 z-50 flex flex-col transition-all duration-300 ease-in-out',
        isMinimized ? 'w-80 h-16' : 'w-96 h-[600px]',
        'bg-background border rounded-lg shadow-lg overflow-hidden',
        'transform transition-transform',
        isMinimized ? 'translate-y-0' : 'translate-y-0'
      )}
    >
      {isMinimized ? (
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-medium">Chat</h3>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={maximizeChat}
              className="h-8 w-8"
              aria-label="Maximize chat"
            >
              <Icons.maximize className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={closeChat}
              className="h-8 w-8"
              aria-label="Close chat"
            >
              <Icons.x className="h-4 w-4" />
            </Button>
          </div>
        </div>
      ) : (
        <ChatPanel
          room={{
            id: 'main',
            name: 'General Chat',
            participants: [],
            unreadCount: 0,
            isGroup: true,
          }}
          onMinimize={minimizeChat}
          onClose={closeChat}
          className="flex-1"
        />
      )}
    </div>
  );
}
