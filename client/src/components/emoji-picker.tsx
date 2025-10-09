import React, { useState, useRef, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/Button';
import { Icons } from '@/components/ui/icons';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { cn } from '@/lib/utils';

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  className?: string;
  buttonVariant?: 'ghost' | 'outline' | 'default' | 'link';
  buttonSize?: 'default' | 'sm' | 'lg' | 'icon';
}

export function EmojiPicker({
  onSelect,
  className,
  buttonVariant = 'ghost',
  buttonSize = 'icon',
}: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleEmojiSelect = (emoji: any) => {
    onSelect(emoji.native);
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)} ref={popoverRef}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant={buttonVariant}
            size={buttonSize}
            className="h-8 w-8 p-0"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Choose an emoji"
          >
            <Icons.smile className="h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[340px] p-0 border-0 shadow-lg" align="end">
          <div className="overflow-hidden rounded-lg">
            <Picker
              data={data}
              onEmojiSelect={handleEmojiSelect}
              theme="light"
              previewPosition="none"
              skinTonePosition="search"
              perLine={8}
              emojiButtonSize={36}
              emojiSize={20}
              navPosition="bottom"
              searchPosition="sticky"
              dynamicWidth={true}
              set="native"
            />
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
