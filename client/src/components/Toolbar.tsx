import React from 'react';
import {
  Save,
  FolderOpen,
  Download,
  Upload,
  Copy,
  Scissors,
  Clipboard,
  Undo,
  Redo,
  Search,
  Replace,
  Settings,
  GitBranch,
  GitCommit,
  GitPullRequest,
  Play,
  Square,
  RotateCcw,
  Terminal
} from 'lucide-react';
import type { ToolbarProps } from '../types/index';

interface ToolbarButtonProps {
  icon: React.ComponentType<any>;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  shortcut?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  active?: boolean;
  badge?: string | number;
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  shortcut,
  variant = 'ghost',
  active = false,
  badge
}) => {
  const baseClasses = "flex items-center space-x-1 px-3 py-2 rounded-lg transition-all duration-300 group relative hover:scale-105";

  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-500 hover:to-purple-500 shadow-lg hover:shadow-xl hover:shadow-blue-500/25",
    secondary: "bg-slate-700/50 text-slate-300 hover:bg-slate-600/50 hover:text-white border border-slate-600/30",
    ghost: "text-slate-400 hover:text-white hover:bg-slate-700/30"
  };

  const activeClasses = active ? "bg-slate-600/50 text-white" : "";

  return (
    <button
      className={`${baseClasses} ${variants[variant]} ${activeClasses} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      }`}
      onClick={onClick}
      disabled={disabled}
      title={`${label}${shortcut ? ` (${shortcut})` : ''}`}
      aria-label={label}
    >
      <Icon className="w-4 h-4" />
      <span className="text-sm hidden sm:inline">{label}</span>

      {/* Badge for notifications */}
      {badge && (
        <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
          {badge}
        </span>
      )}

      {/* Shortcut hint */}
      {shortcut && (
        <span className="ml-auto text-xs text-slate-500 hidden lg:inline">
          {shortcut}
        </span>
      )}

      {/* Enhanced hover tooltip */}
      <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-900/95 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-all duration-200 whitespace-nowrap pointer-events-none backdrop-blur-sm border border-slate-700/50 shadow-lg z-50">
        <div className="flex items-center space-x-2">
          <span>{label}</span>
          {shortcut && (
            <kbd className="px-1.5 py-0.5 bg-slate-800 rounded text-xs font-mono border border-slate-600">
              {shortcut}
            </kbd>
          )}
        </div>
        <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-slate-900/95"></div>
      </div>
    </button>
  );
};

export const Toolbar: React.FC<ToolbarProps> = ({ actions, className = '' }) => {
  const defaultActions: ToolbarButtonProps[] = [
    {
      icon: Play,
      label: 'Run',
      onClick: () => console.log('Run code'),
      shortcut: 'F5',
      variant: 'primary',
      tooltip: 'Run or execute code (F5)'
    },
    {
      icon: Square,
      label: 'Stop',
      onClick: () => console.log('Stop execution'),
      shortcut: 'Shift+F5',
      variant: 'secondary',
      tooltip: 'Stop code execution (Shift+F5)'
    },
    {
      icon: Save,
      label: 'Save',
      onClick: () => console.log('Save'),
      shortcut: 'Ctrl+S',
      variant: 'ghost',
      tooltip: 'Save current file (Ctrl+S)'
    },
    {
      icon: FolderOpen,
      label: 'Open',
      onClick: () => console.log('Open file'),
      shortcut: 'Ctrl+O',
      tooltip: 'Open file or project'
    },
    {
      icon: Copy,
      label: 'Copy',
      onClick: () => console.log('Copy'),
      shortcut: 'Ctrl+C',
      tooltip: 'Copy selected text'
    },
    {
      icon: Clipboard,
      label: 'Paste',
      onClick: () => console.log('Paste'),
      shortcut: 'Ctrl+V',
      tooltip: 'Paste from clipboard'
    },
    {
      icon: Undo,
      label: 'Undo',
      onClick: () => console.log('Undo'),
      shortcut: 'Ctrl+Z',
      disabled: true, // Would be enabled based on history
      tooltip: 'Undo last action (Ctrl+Z)'
    },
    {
      icon: Redo,
      label: 'Redo',
      onClick: () => console.log('Redo'),
      shortcut: 'Ctrl+Y',
      disabled: true, // Would be enabled based on history
      tooltip: 'Redo last undone action (Ctrl+Y)'
    },
    {
      icon: Search,
      label: 'Find',
      onClick: () => console.log('Find'),
      shortcut: 'Ctrl+F',
      tooltip: 'Search in files (Ctrl+F)'
    },
    {
      icon: Replace,
      label: 'Replace',
      onClick: () => console.log('Replace'),
      shortcut: 'Ctrl+H',
      tooltip: 'Find and replace (Ctrl+H)'
    },
    {
      icon: Terminal,
      label: 'Terminal',
      onClick: () => console.log('Toggle terminal'),
      shortcut: 'Ctrl+`',
      tooltip: 'Toggle terminal panel (Ctrl+`)'
    },
    {
      icon: GitBranch,
      label: 'Git',
      onClick: () => console.log('Git'),
      shortcut: 'Ctrl+Shift+G',
      tooltip: 'Git operations'
    },
    {
      icon: Settings,
      label: 'Settings',
      onClick: () => console.log('Settings'),
      shortcut: 'Ctrl+,',
      variant: 'ghost',
      tooltip: 'Editor settings and preferences'
    }
  ];

  const allActions = [...actions, ...defaultActions];

  return (
    <div className={`flex items-center justify-between px-4 py-2 bg-slate-800/50 border-b border-slate-700/30 backdrop-blur-sm ${className}`}>
      {/* Main Actions */}
      <div className="flex items-center space-x-1">
        {allActions.slice(0, 6).map((action, index) => (
          <ToolbarButton key={`${action.label}-${index}`} {...action} />
        ))}
      </div>

      {/* Secondary Actions */}
      <div className="flex items-center space-x-1">
        {allActions.slice(6, 12).map((action, index) => (
          <ToolbarButton key={`${action.label}-${index + 6}`} {...action} />
        ))}
      </div>

      {/* Status Section */}
      <div className="flex items-center space-x-3">
        {/* Git Status */}
        <div className="flex items-center space-x-2 px-3 py-2 bg-slate-700/30 rounded-lg hover:bg-slate-700/40 transition-colors duration-200 cursor-pointer">
          <GitBranch className="w-4 h-4 text-emerald-400" />
          <span className="text-sm text-slate-300">main</span>
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" title="Clean working directory" />
        </div>

        {/* Connection Status */}
        <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/30" />
          <span className="text-sm text-emerald-400 font-medium">Connected</span>
        </div>

        {/* More Actions */}
        <div className="flex items-center space-x-1">
          {allActions.slice(12).map((action, index) => (
            <ToolbarButton key={`${action.label}-${index + 12}`} {...action} />
          ))}
        </div>
      </div>
    </div>
  );
};
