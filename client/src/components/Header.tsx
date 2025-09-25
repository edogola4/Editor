import React, { useState, useEffect } from 'react';
import { Share2, Settings, Sun, Moon, Users, Zap, Command, MoreVertical, Maximize2, Minimize2, GitBranch, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import type { HeaderProps } from '../types/index';
import type { ToolbarAction } from '../types/index';
import { Button } from './ui/Button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/Avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/Tooltip';
import { useTheme } from '../hooks/use-theme';

interface HeaderAction extends ToolbarAction {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
  badge?: string | number;
  shortcut?: string;
  tooltip?: string;
  isActive?: boolean;
}

const HeaderActionButton: React.FC<HeaderAction> = ({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  variant = 'ghost',
  badge,
  tooltip,
  shortcut,
  isActive = false,
  className
}) => {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={variant}
            size="icon"
            onClick={onClick}
            disabled={disabled}
            className={cn(
              'relative group transition-all duration-200',
              isActive && 'bg-accent text-accent-foreground',
              className
            )}
            aria-label={label}
          >
            <Icon className="h-4 w-4" />
            {badge !== undefined && (
              <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-[10px] font-medium rounded-full h-4 w-4 flex items-center justify-center">
                {badge}
              </span>
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="flex items-center gap-2">
          <span>{tooltip || label}</span>
          {shortcut && (
            <kbd className="bg-muted text-muted-foreground px-1.5 py-0.5 text-xs rounded border border-border font-mono">
              {shortcut}
            </kbd>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

const UserAvatar = ({ user, className }: { user: { id: string; username: string; avatar?: string }, className?: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <div className={cn('relative', className)}>
        <Avatar className="h-8 w-8 border-2 border-background">
          <AvatarImage src={user.avatar} alt={user.username} />
          <AvatarFallback className="text-xs">
            {user.username.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 border-background bg-green-500"></div>
      </div>
    </TooltipTrigger>
    <TooltipContent side="bottom">
      <p>{user.username}</p>
    </TooltipContent>
  </Tooltip>
);

export const Header: React.FC<HeaderProps> = ({
  documentId,
  users = [],
  onShare,
  onSettings,
  onThemeToggle,
  onCommandPalette,
  className,
  ...props
}) => {
  const { theme, setTheme } = useTheme();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const activeUsers = users.filter(user => user.connectionStatus === 'online');
  const isDarkTheme = theme === 'dark';

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(console.error);
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleTheme = () => {
    const newTheme = isDarkTheme ? 'light' : 'dark';
    setTheme(newTheme);
    if (onThemeToggle) onThemeToggle();
  };

  const actions: HeaderAction[] = [
    {
      id: 'branch',
      label: 'Branch',
      icon: GitBranch,
      onClick: () => {},
      variant: 'ghost',
      tooltip: 'View branches (Ctrl+Shift+B)'
    },
    {
      id: 'search',
      label: 'Search',
      icon: Search,
      onClick: () => {},
      variant: 'ghost',
      shortcut: 'Ctrl+F',
      tooltip: 'Search in files (Ctrl+F)'
    },
    {
      id: 'command',
      label: 'Command Palette',
      icon: Command,
      onClick: onCommandPalette || (() => {}),
      variant: 'ghost',
      shortcut: 'Ctrl+K',
      tooltip: 'Open command palette (Ctrl+K)'
    },
    {
      id: 'share',
      label: 'Share',
      icon: Share2,
      onClick: onShare || (() => {}),
      variant: 'primary',
      badge: activeUsers.length,
      tooltip: `Share with ${activeUsers.length} other ${activeUsers.length === 1 ? 'user' : 'users'}`,
      className: 'hidden sm:flex'
    },
    {
      id: 'theme',
      label: 'Toggle Theme',
      icon: isDarkTheme ? Sun : Moon,
      onClick: toggleTheme,
      variant: 'ghost',
      tooltip: `Switch to ${isDarkTheme ? 'light' : 'dark'} theme`
    },
    {
      id: 'fullscreen',
      label: 'Toggle Fullscreen',
      icon: isFullscreen ? Minimize2 : Maximize2,
      onClick: toggleFullscreen,
      variant: 'ghost',
      tooltip: isFullscreen ? 'Exit fullscreen (F11)' : 'Enter fullscreen (F11)'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: onSettings || (() => {}),
      variant: 'ghost',
      tooltip: 'Settings (Ctrl\,)'
    },
    {
      id: 'more',
      label: 'More options',
      icon: MoreVertical,
      onClick: () => {},
      variant: 'ghost',
      tooltip: 'Additional options'
    }
  ];

  return (
    <header className="backdrop-blur-md bg-slate-900/90 border-b border-slate-700/50 px-6 py-3 flex-shrink-0 relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-emerald-600/5 animate-pulse"></div>

      <div className="flex items-center justify-between relative z-10">
        {/* Left Section - Logo and Document Info */}
        <div className="flex items-center space-x-6">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg hover:scale-105 transition-transform duration-300 cursor-pointer">
              <span className="text-white font-bold text-sm">CE</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white tracking-tight bg-gradient-to-r from-white to-slate-300 bg-clip-text">
                Collaborative Editor
              </h1>
              <div className="flex items-center space-x-2 mt-0.5">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/30"></div>
                <span className="text-xs text-slate-400 font-mono">
                  {documentId ? documentId.slice(0, 16) + '...' : 'No Session'}
                </span>
              </div>
            </div>
          </div>

          {/* Session Status */}
          <div className="flex items-center space-x-3 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full hover:bg-emerald-500/15 transition-colors duration-200">
            <Zap className="w-3 h-3 text-emerald-400" />
            <span className="text-sm text-emerald-400 font-medium">Live Session</span>
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3 text-slate-400" />
              <span className="text-xs text-slate-400">{activeUsers.length + 1} active</span>
            </div>
          </div>
        </div>

        {/* Right Section - Actions and User Presence */}
        <div className="flex items-center space-x-1">
          <div className="flex items-center -space-x-1 mr-2">
            {activeUsers.slice(0, 3).map((user) => (
              <UserAvatar key={user.id} user={user} />
            ))}
            {activeUsers.length > 3 && (
              <div className="h-7 w-7 rounded-full bg-muted border-2 border-background flex items-center justify-center text-[10px] font-medium">
                +{activeUsers.length - 3}
              </div>
            )}
          </div>
          
          <div className="h-6 w-px bg-border mx-1" />
          
          <div className="flex items-center space-x-1">
            {actions.map((action) => (
              <HeaderActionButton key={action.id} {...action} />
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }

        .animate-scale-in {
          animation: scaleIn 0.3s ease-out forwards;
        }`
      }} />
    </header>
  );
};
