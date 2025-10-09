import React from 'react';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/ui/icons';
import { useChat } from '@/contexts/ChatContext';
import { Badge } from '@/components/ui/badge';

export function ChatToggle() {
  const { isChatOpen, toggleChat, rooms } = useChat();
  
  // Calculate total unread messages across all rooms
  const totalUnread = rooms.reduce((sum, room) => sum + room.unreadCount, 0);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleChat}
      className="relative"
      aria-label={isChatOpen ? 'Close chat' : 'Open chat'}
    >
      <Icons.messageSquare className="h-5 w-5" />
      {totalUnread > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 rounded-full"
        >
          {totalUnread > 9 ? '9+' : totalUnread}
        </Badge>
      )}
    </Button>
  );
}
