// Enhanced TypeScript interfaces for professional UI components
import React from 'react';

// Cache buster - force reload
// Last updated: 2025-09-23T17:50:00+03:00

export interface Position {
  line: number;
  column: number;
}

export interface Range {
  start: Position;
  end: Position;
}

export interface UserPresence {
  id: string;
  name: string;
  avatar: string;
  cursor: Position;
  selection: Range | null;
  color: string;
  isTyping: boolean;
  lastSeen: number;
  connectionStatus: 'online' | 'away' | 'offline';
  permissions?: 'read' | 'write' | 'admin';
}

export interface FileNode {
  id: string;
  name: string;
  type: 'file' | 'directory';
  path: string;
  children?: FileNode[];
  isOpen?: boolean;
  isSelected?: boolean;
  fileType?: string;
  size?: number;
  lastModified?: Date;
  permissions?: 'read' | 'write' | 'execute';
}

export interface EditorTheme {
  name: string;
  displayName: string;
  colors: {
    background: string;
    foreground: string;
    selection: string;
    cursor: string;
    lineHighlight: string;
    sidebar: string;
    statusBar: string;
  };
}

export interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  onClick: () => void;
  shortcut?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  tooltip?: string;
  badge?: string | number;
}

export interface StatusBarItem {
  id: string;
  label: string;
  value?: string | number;
  icon?: React.ComponentType<any>;
  onClick?: () => void;
  priority?: number;
  className?: string;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
}

export interface CollaborationEvent {
  type: 'cursor_move' | 'selection_change' | 'typing_start' | 'typing_stop' | 'user_join' | 'user_leave' | 'file_change';
  userId: string;
  timestamp: number;
  data?: any;
}

export interface NotificationItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

// Component prop interfaces
export interface HeaderProps {
  documentId: string;
  users: UserPresence[];
  onShare?: () => void;
  onSettings?: () => void;
  onThemeToggle?: () => void;
  onCommandPalette?: () => void;
}

export interface ToolbarProps {
  actions: ToolbarAction[];
  className?: string;
}

export interface FileExplorerProps {
  files: FileNode[];
  onFileSelect: (file: FileNode) => void;
  onFileOpen: (file: FileNode) => void;
  onFileCreate?: (parent: FileNode) => void;
  onFileDelete?: (file: FileNode) => void;
  selectedFile?: string;
  loading?: boolean;
}

export interface UserPresenceProps {
  users: UserPresence[];
  showDetails?: boolean;
  compact?: boolean;
  maxAvatars?: number;
}

export interface StatusBarProps {
  language: string;
  cursorPosition: Position;
  selection?: Range;
  userCount: number;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'error';
  showDetailed?: boolean;
  items?: StatusBarItem[];
}

export interface MonacoEditorProps {
  value: string;
  language: string;
  onChange: (value: string) => void;
  onCursorChange?: (position: Position) => void;
  onSelectionChange?: (selection: Range) => void;
  theme?: string;
  options?: any;
  height?: string | number;
  users?: UserPresence[];
}

export interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ComponentType<any>;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
}

export interface AvatarProps {
  src?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  status?: 'online' | 'away' | 'offline' | 'busy';
  showStatus?: boolean;
  className?: string;
}

export interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  commands: Command[];
}

export interface Command {
  id: string;
  label: string;
  description?: string;
  icon?: React.ComponentType<any>;
  shortcut?: string;
  action: () => void;
  category?: string;
}

export interface LoadingSpinnerProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
}

export interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

// Animation and transition types
export interface AnimationConfig {
  duration: number;
  easing: string;
  delay?: number;
}

export interface TransitionProps {
  enter?: AnimationConfig;
  exit?: AnimationConfig;
  initial?: boolean;
}

// Accessibility types
export interface AriaProps {
  label?: string;
  labelledBy?: string;
  describedBy?: string;
  expanded?: boolean;
  controls?: string;
  role?: string;
  live?: 'assertive' | 'polite' | 'off';
}

// Performance optimization types
export interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscan?: number;
}
