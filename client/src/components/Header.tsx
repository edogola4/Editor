import React from 'react';
import { Share2, Settings, Sun, Moon, Users, Zap, Command, MoreVertical } from 'lucide-react';
// Try importing HeaderProps with explicit path
import type { HeaderProps } from '../types/index';
import type { ToolbarAction } from '../types/index';

interface HeaderAction extends ToolbarAction {
  variant?: 'primary' | 'secondary' | 'ghost';
  badge?: string | number;
}

const HeaderActionButton: React.FC<HeaderAction> = ({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  variant = 'ghost',
  badge,
  tooltip
}) => {
  const baseClasses = "relative p-2 rounded-lg transition-all duration-300 flex items-center justify-center group hover:scale-105";

  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-xl hover:shadow-blue-500/25",
    secondary: "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white border border-slate-600/30",
    ghost: "text-slate-400 hover:text-white hover:bg-slate-700/30"
  };

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onClick={onClick}
      disabled={disabled}
      title={tooltip || label}
      aria-label={label}
    >
      <Icon className="w-4 h-4" />
      {badge && (
        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium animate-pulse">
          {badge}
        </span>
      )}
      {/* Enhanced hover tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none backdrop-blur-sm border border-slate-700/50 shadow-lg">
        {tooltip || label}
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900/95"></div>
      </div>
    </button>
  );
};

export const Header: React.FC<HeaderProps> = ({
  documentId,
  users,
  onShare,
  onSettings,
  onThemeToggle,
  onCommandPalette
}) => {
  const activeUsers = users.filter(user => user.connectionStatus === 'online');
  const isDarkTheme = true; // This would come from theme context

  const actions: HeaderAction[] = [
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
      label: 'Share Session',
      icon: Share2,
      onClick: onShare || (() => {}),
      variant: 'primary',
      badge: activeUsers.length,
      tooltip: `Share session with ${activeUsers.length + 1} users`
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      onClick: onSettings || (() => {}),
      variant: 'ghost',
      tooltip: 'Editor settings and preferences'
    },
    {
      id: 'theme',
      label: 'Toggle Theme',
      icon: isDarkTheme ? Sun : Moon,
      onClick: onThemeToggle || (() => {}),
      variant: 'ghost',
      tooltip: `Switch to ${isDarkTheme ? 'light' : 'dark'} theme`
    },
    {
      id: 'more',
      label: 'More Options',
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
        <div className="flex items-center space-x-4">
          {/* User Avatars */}
          <div className="flex items-center -space-x-2">
            {/* Current user */}
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full border-2 border-slate-800 flex items-center justify-center text-white text-xs font-medium shadow-lg relative hover:scale-110 transition-transform duration-200 cursor-pointer">
              <span>You</span>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border border-slate-800 animate-pulse"></div>
            </div>

            {/* Other users */}
            {activeUsers.slice(0, 4).map((user, index) => (
              <div
                key={user.id}
                className="w-7 h-7 rounded-full border-2 border-slate-800 flex items-center justify-center text-white text-xs font-medium shadow-lg animate-scale-in relative hover:scale-110 transition-transform duration-200 cursor-pointer"
                style={{
                  backgroundColor: user.color,
                  animationDelay: `${index * 100}ms`,
                  zIndex: 10 - index
                }}
                title={`${user.name} (${user.connectionStatus})`}
              >
                {user.name.charAt(0).toUpperCase()}
                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border border-slate-800 ${
                  user.connectionStatus === 'online' ? 'bg-emerald-400' :
                  user.connectionStatus === 'away' ? 'bg-amber-400' : 'bg-slate-400'
                }`}></div>
              </div>
            ))}

            {activeUsers.length > 4 && (
              <div className="w-7 h-7 bg-slate-600 rounded-full border-2 border-slate-800 flex items-center justify-center text-white text-xs font-medium shadow-lg hover:scale-110 transition-transform duration-200 cursor-pointer">
                +{activeUsers.length - 4}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-1">
            {actions.map(action => (
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
