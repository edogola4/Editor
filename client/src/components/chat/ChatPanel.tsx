import React, { useEffect, useRef, useState } from 'react';
import { type ChatMessage, type ChatRoom } from '../../types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Icons } from '@/components/ui/icons';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { format } from 'date-fns';
import { EmojiPicker } from '@/components/emoji-picker';
import { useChat } from '@/hooks/use-chat';

interface ChatPanelProps {
  room: ChatRoom;
  onMinimize: () => void;
  onClose: () => void;
  className?: string;
}

export function ChatPanel({ room, onMinimize, onClose, className }: ChatPanelProps) {
  const [message, setMessage] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { user } = useUser();
  const { messages, sendMessage, isLoading, error } = useChat(room.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;

    sendMessage({
      roomId: room.id,
      content: message.trim(),
    });
    setMessage('');
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    const atBottom = scrollHeight - scrollTop - clientHeight < 50;
    setIsAtBottom(atBottom);
    setIsScrolled(scrollTop > 0);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isAtBottom) {
      scrollToBottom();
    }
  }, [messages, isAtBottom]);

  const handleEmojiSelect = (emoji: string) => {
    setMessage((prev) => prev + emoji);
  };

  return (
    <div className={cn('flex flex-col h-full bg-background border rounded-lg overflow-hidden', className)}>
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold">{room.name}</h3>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
            {room.participants.length} online
          </span>
        </div>
        <div className="flex space-x-1">
          <Button variant="ghost" size="icon" onClick={onMinimize}>
            <Icons.minimize className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <Icons.x className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <ScrollArea
          ref={scrollAreaRef}
          className="h-full px-4 py-2"
          onScroll={handleScroll}
        >
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center py-4">
                <Icons.spinner className="h-6 w-6 animate-spin" />
              </div>
            ) : error ? (
              <div className="text-center text-destructive py-4">{error}</div>
            ) : messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                No messages yet. Start the conversation!
              </div>
            ) : (
              messages.map((msg) => (
                <MessageItem key={msg.id} message={msg} isOwn={msg.userId === user?.id} />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {!isAtBottom && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
            <Button
              variant="outline"
              size="sm"
              onClick={scrollToBottom}
              className="rounded-full shadow-md"
            >
              <Icons.arrowDown className="h-4 w-4 mr-2" />
              New messages
            </Button>
          </div>
        )}
      </div>

      <div className="border-t p-3">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <div className="relative flex-1">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
              className="pr-10"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
              <EmojiPicker onSelect={handleEmojiSelect} />
            </div>
          </div>
          <Button type="submit" disabled={!message.trim()}>
            <Icons.send className="h-4 w-4 mr-2" />
            Send
          </Button>
        </form>
      </div>
    </div>
  );
}

interface MessageItemProps {
  message: ChatMessage;
  isOwn: boolean;
}

function MessageItem({ message, isOwn }: MessageItemProps) {
  return (
    <div className={cn('flex gap-3', isOwn ? 'justify-end' : 'justify-start')}>
      {!isOwn && (
        <Avatar className="h-8 w-8 mt-1">
          <AvatarImage src={message.avatar} />
          <AvatarFallback>{message.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
      )}
      <div className={cn('flex-1 max-w-[80%]', isOwn && 'flex flex-col items-end')}>
        {!isOwn && (
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-sm font-medium">{message.username}</span>
            <span className="text-xs text-muted-foreground">
              {format(new Date(message.timestamp), 'h:mm a')}
            </span>
          </div>
        )}
        <div
          className={cn(
            'rounded-lg px-4 py-2 text-sm',
            isOwn
              ? 'bg-primary text-primary-foreground rounded-br-none'
              : 'bg-muted rounded-bl-none'
          )}
        >
          {message.content}
        </div>
        {isOwn && (
          <span className="text-xs text-muted-foreground mt-1">
            {format(new Date(message.timestamp), 'h:mm a')}
          </span>
        )}
      </div>
    </div>
  );
}
