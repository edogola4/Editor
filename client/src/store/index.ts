import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { v4 as uuidv4 } from 'uuid';
import type { User } from '../contexts/CollaborationContext';
import { 
  StoreState, 
  EditorState, 
  RoomState, 
  UserState, 
  SocketState, 
  UIState 
} from './types';

// Initial states
const initialEditorState: EditorState = {
  content: '',
  language: 'plaintext',
  isSaving: false,
  lastSaved: null,
  viewState: null,
  decorations: [],
  isDirty: false,
  version: 0,
  lastModified: null,
  lastModifiedBy: null,
};

const initialRoomState: RoomState = {
  id: '',
  name: '',
  description: '',
  isPrivate: false,
  ownerId: '',
  members: {},
  settings: {
    allowGuestEdits: false,
    requireApproval: true,
    maxUsers: 10,
    theme: 'system',
  },
  currentUsers: [],
  isConnected: false,
};

const initialUserState: UserState = {
  currentUser: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  preferences: {
    theme: 'system',
    fontSize: 14,
    wordWrap: true,
    minimap: true,
    lineNumbers: 'on',
  },
};

const initialSocketState: SocketState = {
  isConnected: false,
  isConnecting: false,
  lastPing: null,
  latency: 0,
  reconnectAttempts: 0,
  lastError: null,
  roomConnection: {
    roomId: null,
    isConnected: false,
    lastSync: null,
  },
};

const initialUIState: UIState = {
  isSidebarOpen: true,
  activePanel: 'explorer',
  notifications: [],
  modal: {
    isOpen: false,
    type: null,
    props: {},
  },
  isCommandPaletteOpen: false,
  isSettingsOpen: false,
};

// Create the store with middleware
const useStore = create<StoreState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial states
          editor: { ...initialEditorState },
          room: { ...initialRoomState },
          user: { ...initialUserState },
          socket: { ...initialSocketState },
          ui: { ...initialUIState },

          // State setters with immer for immutable updates
          setEditorState: (updater) =>
            set(
              (state) => {
                const nextState = typeof updater === 'function' ? updater(state.editor) : updater;
                state.editor = { ...state.editor, ...nextState };
              },
              false,
              'editor/updateEditorState'
            ),

          setRoomState: (updater) =>
            set(
              (state) => {
                const nextState = typeof updater === 'function' ? updater(state.room) : updater;
                state.room = { ...state.room, ...nextState };
              },
              false,
              'room/updateRoomState'
            ),

          setUserState: (updater) =>
            set(
              (state) => {
                const nextState = typeof updater === 'function' ? updater(state.user) : updater;
                state.user = { ...state.user, ...nextState };
              },
              false,
              'user/updateUserState'
            ),

          setSocketState: (updater) =>
            set(
              (state) => {
                const nextState = typeof updater === 'function' ? updater(state.socket) : updater;
                state.socket = { ...state.socket, ...nextState };
              },
              false,
              'socket/updateSocketState'
            ),

          setUIState: (updater) =>
            set(
              (state) => {
                const nextState = typeof updater === 'function' ? updater(state.ui) : updater;
                state.ui = { ...state.ui, ...nextState };
              },
              false,
              'ui/updateUIState'
            ),

          // Utility function to reset the entire store
          resetStore: () =>
            set(
              (state) => {
                state.editor = { ...initialEditorState };
                state.room = { ...initialRoomState };
                state.user = { ...initialUserState };
                state.socket = { ...initialSocketState };
                state.ui = { ...initialUIState };
              },
              false,
              'resetStore'
            ),
        }))
      ),
      {
        name: 'editor-app-storage',
        // Only persist specific parts of the state
        partialize: (state) => ({
          editor: {
            language: state.editor.language,
            viewState: state.editor.viewState,
          },
          user: {
            currentUser: state.user.currentUser,
            isAuthenticated: state.user.isAuthenticated,
            preferences: state.user.preferences,
          },
          ui: {
            isSidebarOpen: state.ui.isSidebarOpen,
            activePanel: state.ui.activePanel,
          },
        }),
        version: 1,
      }
    ),
    {
      name: 'EditorStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// Selectors for optimized re-renders
export const useEditor = () => useStore((state) => state.editor);
export const useRoom = () => useStore((state) => state.room);
export const useUser = () => useStore((state) => state.user);
export const useSocket = () => useStore((state) => state.socket);
export const useUI = () => useStore((state) => state.ui);

export const useEditorActions = () => useStore((state) => ({
  setEditorState: state.setEditorState,
}));

export const useRoomActions = () => useStore((state) => ({
  setRoomState: state.setRoomState,
}));

export const useUserActions = () => useStore((state) => ({
  setUserState: state.setUserState,
}));

export const useSocketActions = () => useStore((state) => ({
  setSocketState: state.setSocketState,
}));

export const useUIActions = () => useStore((state) => ({
  setUIState: state.setUIState,
  // UI specific actions
  toggleSidebar: () => 
    state.setUIState(prev => ({ isSidebarOpen: !prev.isSidebarOpen })),
  
  showNotification: (notification: Omit<UIState['notifications'][0], 'id' | 'timestamp'>) =>
    state.setUIState(prev => ({
      notifications: [
        ...prev.notifications,
        { ...notification, id: uuidv4(), timestamp: new Date() }
      ].slice(-5) // Keep only the last 5 notifications
    })),
    
  removeNotification: (id: string) =>
    state.setUIState(prev => ({
      notifications: prev.notifications.filter(n => n.id !== id)
    })),
    
  openModal: (type: string, props: Record<string, any> = {}) =>
    state.setUIState({
      modal: {
        isOpen: true,
        type,
        props
      }
    }),
    
  closeModal: () =>
    state.setUIState({
      modal: {
        isOpen: false,
        type: null,
        props: {}
      }
    }),
    
  toggleCommandPalette: () =>
    state.setUIState(prev => ({ isCommandPaletteOpen: !prev.isCommandPaletteOpen })),
    
  toggleSettings: () =>
    state.setUIState(prev => ({ isSettingsOpen: !prev.isSettingsOpen }))
}));

export default useStore;
