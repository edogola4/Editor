import React from 'react';
import {
  GitBranch,
  Globe,
  Users,
  MousePointer,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  Clock,
  FileText,
  Hash,
  Zap
} from 'lucide-react';
import type { StatusBarProps, StatusBarItem, UserPresence, Position } from '../types/index';
import { useEditorStore } from '../store/editorStore';

interface StatusBarButtonProps {
  item: StatusBarItem;
  onClick?: () => void;
}

const StatusBarButton: React.FC<StatusBarButtonProps> = ({ item, onClick }) => {
  const { icon: Icon, label, value, className = '', variant = 'default' } = item;

  const variantClasses = {
    default: 'text-slate-400 hover:text-slate-300',
    success: 'text-emerald-400 hover:text-emerald-300',
    warning: 'text-amber-400 hover:text-amber-300',
    error: 'text-red-400 hover:text-red-300',
    info: 'text-blue-400 hover:text-blue-300'
  };

  return (
    <button
      onClick={onClick}
      className={`flex items-center space-x-2 px-3 py-1.5 rounded-md transition-all duration-200 hover:bg-slate-700/30 ${variantClasses[variant]} ${className}`}
      title={label}
      aria-label={label}
    >
      {Icon && <Icon className="w-3 h-3" />}
      <span className="text-xs font-medium">{label}</span>
      {value && <span className="text-xs">{value}</span>}
    </button>
  );
};

export const StatusBar: React.FC<StatusBarProps> = ({
  language,
  cursorPosition,
  selection,
  userCount,
  connectionStatus,
  showDetailed = false,
  items = []
}) => {
  const { connectedUsers } = useEditorStore();

  const getLanguageDisplayName = (lang: string) => {
    const languageMap: Record<string, string> = {
      javascript: 'JavaScript',
      typescript: 'TypeScript',
      python: 'Python',
      java: 'Java',
      cpp: 'C++',
      csharp: 'C#',
      go: 'Go',
      rust: 'Rust',
      php: 'PHP',
      ruby: 'Ruby',
      html: 'HTML',
      css: 'CSS',
      json: 'JSON',
      yaml: 'YAML',
      markdown: 'Markdown',
      sql: 'SQL'
    };
    return languageMap[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="w-3 h-3 text-emerald-400" />;
      case 'connecting':
        return <Clock className="w-3 h-3 text-amber-400 animate-pulse" />;
      case 'error':
        return <WifiOff className="w-3 h-3 text-red-400" />;
      default:
        return <WifiOff className="w-3 h-3 text-slate-400" />;
    }
  };

  const getConnectionText = () => {
    switch (connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'error':
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };

  const getConnectionVariant = (): 'success' | 'warning' | 'error' | 'default' => {
    switch (connectionStatus) {
      case 'connected':
        return 'success';
      case 'connecting':
        return 'warning';
      case 'error':
        return 'error';
      default:
        return 'default';
    }
  };

  const defaultItems: StatusBarItem[] = [
    {
      id: 'cursor',
      label: `Ln ${cursorPosition.line}, Col ${cursorPosition.column}`,
      icon: MousePointer,
      variant: 'info',
      priority: 10
    },
    {
      id: 'selection',
      label: selection ? `${selection.end.line - selection.start.line + 1} selected` : '',
      icon: FileText,
      variant: 'info',
      priority: 9
    },
    {
      id: 'language',
      label: getLanguageDisplayName(language),
      icon: FileText,
      variant: 'default',
      priority: 8
    },
    {
      id: 'encoding',
      label: 'UTF-8',
      icon: Globe,
      variant: 'default',
      priority: 7
    },
    {
      id: 'git',
      label: 'main',
      icon: GitBranch,
      variant: 'success',
      priority: 6
    },
    {
      id: 'connection',
      label: getConnectionText(),
      icon: getConnectionIcon,
      variant: getConnectionVariant(),
      priority: 5
    },
    {
      id: 'users',
      label: `${userCount} users`,
      value: userCount,
      icon: Users,
      variant: 'info',
      priority: 4
    }
  ];

  const allItems = [...items, ...defaultItems]
    .filter(item => item.label || item.value)
    .sort((a, b) => (b.priority || 0) - (a.priority || 0));

  if (!showDetailed) {
    // Compact status bar
    return (
      <div className="bg-slate-800/50 border-t border-slate-700/30 px-4 py-2 flex items-center justify-between text-sm backdrop-blur-sm">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/30"></div>
            <span className="text-emerald-400 font-medium">Ready</span>
          </div>

          <span className="text-slate-400">•</span>

          <div className="flex items-center space-x-1">
            <FileText className="w-3 h-3 text-blue-400" />
            <span className="text-blue-400">{getLanguageDisplayName(language)}</span>
          </div>

          <span className="text-slate-400">•</span>

          <div className="flex items-center space-x-1">
            <MousePointer className="w-3 h-3 text-slate-400" />
            <span className="text-slate-400">{cursorPosition.line}:{cursorPosition.column}</span>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1">
            <Users className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400">{userCount} online</span>
          </div>

          <span className="text-slate-400">•</span>

          <div className="flex items-center space-x-1">
            {getConnectionIcon()}
            <span className={`text-sm font-medium ${
              connectionStatus === 'connected' ? 'text-emerald-400' :
              connectionStatus === 'connecting' ? 'text-amber-400' :
              'text-red-400'
            }`}>
              {getConnectionText()}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Detailed status bar
  return (
    <div className="bg-slate-800/50 border-t border-slate-700/30 px-4 py-3 backdrop-blur-sm">
      <div className="flex items-center justify-between">
        {/* Left Section */}
        <div className="flex items-center space-x-3">
          {/* Status indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse shadow-sm shadow-emerald-400/30"></div>
            <span className="text-sm text-emerald-400 font-medium">Ready</span>
          </div>

          {/* Language */}
          <StatusBarButton
            item={{
              id: 'language',
              label: getLanguageDisplayName(language),
              icon: FileText,
              variant: 'default'
            }}
          />

          {/* Cursor position */}
          <StatusBarButton
            item={{
              id: 'cursor',
              label: `${cursorPosition.line}:${cursorPosition.column}`,
              icon: MousePointer,
              variant: 'info'
            }}
          />

          {/* Selection info */}
          {selection && (
            <StatusBarButton
              item={{
                id: 'selection',
                label: `${selection.end.line - selection.start.line + 1} lines`,
                icon: Hash,
                variant: 'info'
              }}
            />
          )}

          {/* Encoding */}
          <StatusBarButton
            item={{
              id: 'encoding',
              label: 'UTF-8',
              icon: Globe,
              variant: 'default'
            }}
          />
        </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* Git branch */}
          <StatusBarButton
            item={{
              id: 'git',
              label: 'main',
              icon: GitBranch,
              variant: 'success'
            }}
          />

          {/* User count */}
          <StatusBarButton
            item={{
              id: 'users',
              label: 'Users',
              value: userCount,
              icon: Users,
              variant: 'info'
            }}
          />

          {/* Connection status */}
          <StatusBarButton
            item={{
              id: 'connection',
              label: getConnectionText(),
              icon: getConnectionIcon,
              variant: getConnectionVariant()
            }}
          />

          {/* Performance indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <Zap className="w-3 h-3 text-blue-400" />
            <span className="text-xs text-blue-400 font-medium">Live</span>
          </div>
        </div>
      </div>

      {/* User avatars for active collaborators */}
      {connectedUsers.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-700/30">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">Active collaborators:</span>
            <div className="flex items-center -space-x-2">
              {connectedUsers.slice(0, 5).map((user, index) => (
                <div
                  key={user.id}
                  className="w-6 h-6 rounded-full border-2 border-slate-700 flex items-center justify-center text-white text-xs font-medium shadow-lg relative"
                  style={{
                    backgroundColor: user.color,
                    zIndex: 10 - index
                  }}
                  title={`${user.name} (${user.connectionStatus})`}
                >
                  {user.name.charAt(0).toUpperCase()}
                  <div className={`absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full border border-slate-700 ${
                    user.connectionStatus === 'online' ? 'bg-emerald-400' : 'bg-amber-400'
                  }`}></div>
                </div>
              ))}
              {connectedUsers.length > 5 && (
                <div className="w-6 h-6 bg-slate-600 rounded-full border-2 border-slate-700 flex items-center justify-center text-white text-xs font-medium shadow-lg">
                  +{connectedUsers.length - 5}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
