import type { User } from '../contexts/CollaborationContext';

export interface EditorState {
  content: string;
  language: string;
  isSaving: boolean;
  lastSaved: Date | null;
  viewState: any; // Monaco editor view state
  decorations: string[];
  isDirty: boolean;
  version: number;
  lastModified: Date | null;
  lastModifiedBy: string | null;
}

export interface RoomState {
  id: string;
  name: string;
  description: string;
  isPrivate: boolean;
  password?: string;
  ownerId: string;
  members: Record<string, User>;
  settings: {
    allowGuestEdits: boolean;
    requireApproval: boolean;
    maxUsers: number;
    theme: 'light' | 'dark' | 'system';
  };
  currentUsers: string[];
  isConnected: boolean;
}

export interface UserState {
  currentUser: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  preferences: {
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
    wordWrap: boolean;
    minimap: boolean;
    lineNumbers: 'on' | 'off' | 'relative' | 'interval';
  };
}

export interface SocketState {
  isConnected: boolean;
  isConnecting: boolean;
  lastPing: number | null;
  latency: number;
  reconnectAttempts: number;
  lastError: string | null;
  roomConnection: {
    roomId: string | null;
    isConnected: boolean;
    lastSync: number | null;
  };
}

export interface UIState {
  isSidebarOpen: boolean;
  activePanel: 'explorer' | 'search' | 'git' | 'debug' | 'extensions' | null;
  notifications: Array<{
    id: string;
    type: 'info' | 'success' | 'warning' | 'error';
    message: string;
    timestamp: Date;
  }>;
  modal: {
    isOpen: boolean;
    type: string | null;
    props: Record<string, any>;
  };
  isCommandPaletteOpen: boolean;
  isSettingsOpen: boolean;
}

// Action types
export type EditorAction =
  | { type: 'SET_CONTENT'; payload: string }
  | { type: 'UPDATE_CONTENT'; payload: { content: string; version: number } }
  | { type: 'SET_LANGUAGE'; payload: string }
  | { type: 'SET_VIEW_STATE'; payload: any }
  | { type: 'SET_IS_SAVING'; payload: boolean }
  | { type: 'SET_LAST_SAVED'; payload: Date }
  | { type: 'SET_IS_DIRTY'; payload: boolean };

export type RoomAction =
  | { type: 'SET_ROOM'; payload: Partial<RoomState> }
  | { type: 'ADD_MEMBER'; payload: User }
  | { type: 'REMOVE_MEMBER'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<RoomState['settings']> }
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean };

export type UserAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_AUTH_STATUS'; payload: boolean }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<UserState['preferences']> };

export type SocketAction =
  | { type: 'SET_CONNECTION_STATUS'; payload: boolean }
  | { type: 'SET_IS_CONNECTING'; payload: boolean }
  | { type: 'SET_LAST_PING'; payload: number }
  | { type: 'SET_LATENCY'; payload: number }
  | { type: 'INCREMENT_RECONNECT_ATTEMPTS' }
  | { type: 'SET_LAST_ERROR'; payload: string | null }
  | { type: 'SET_ROOM_CONNECTION'; payload: Partial<SocketState['roomConnection']> };

export type UIAction =
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'SET_ACTIVE_PANEL'; payload: UIState['activePanel'] }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<UIState['notifications'][0], 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'OPEN_MODAL'; payload: { type: string; props?: Record<string, any> } }
  | { type: 'CLOSE_MODAL' }
  | { type: 'TOGGLE_COMMAND_PALETTE' }
  | { type: 'TOGGLE_SETTINGS' };

// Store types
export interface StoreState {
  editor: EditorState;
  room: RoomState;
  user: UserState;
  socket: SocketState;
  ui: UIState;
  // Actions
  setEditorState: (state: Partial<EditorState> | ((prev: EditorState) => Partial<EditorState>)) => void;
  setRoomState: (state: Partial<RoomState> | ((prev: RoomState) => Partial<RoomState>)) => void;
  setUserState: (state: Partial<UserState> | ((prev: UserState) => Partial<UserState>)) => void;
  setSocketState: (state: Partial<SocketState> | ((prev: SocketState) => Partial<SocketState>)) => void;
  setUIState: (state: Partial<UIState> | ((prev: UIState) => Partial<UIState>)) => void;
  // Utility functions
  resetStore: () => void;
}
