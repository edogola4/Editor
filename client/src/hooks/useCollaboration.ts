import { useEffect, useRef, useCallback, useReducer } from 'react';
import { webSocketService } from '../services/WebSocketService';
import { Operation } from 'ot-types';

export interface CursorPosition {
  row: number;
  column: number;
}

export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
  isBackward?: boolean;
}

export interface RemoteUser {
  id: string;
  username: string;
  color: string;
  cursor: CursorPosition | null;
  selection: SelectionRange | null;
}

interface CollaborationState {
  connected: boolean;
  users: Record<string, RemoteUser>;
  version: number;
  error: string | null;
}

type CollaborationAction =
  | { type: 'SET_CONNECTED'; payload: boolean }
  | { type: 'ADD_USER'; payload: { id: string; username: string; color: string } }
  | { type: 'REMOVE_USER'; payload: string }
  | { type: 'UPDATE_CURSOR'; payload: { userId: string; cursor: CursorPosition | null; selection: SelectionRange | null } }
  | { type: 'SET_VERSION'; payload: number }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: CollaborationState = {
  connected: false,
  users: {},
  version: 0,
  error: null,
};

function collaborationReducer(state: CollaborationState, action: CollaborationAction): CollaborationState {
  switch (action.type) {
    case 'SET_CONNECTED':
      return { ...state, connected: action.payload };
    case 'ADD_USER':
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.id]: {
            id: action.payload.id,
            username: action.payload.username,
            color: action.payload.color,
            cursor: null,
            selection: null,
          },
        },
      };
    case 'REMOVE_USER':
      const newUsers = { ...state.users };
      delete newUsers[action.payload];
      return { ...state, users: newUsers };
    case 'UPDATE_CURSOR':
      const user = state.users[action.payload.userId];
      if (!user) return state;
      
      return {
        ...state,
        users: {
          ...state.users,
          [action.payload.userId]: {
            ...user,
            cursor: action.payload.cursor,
            selection: action.payload.selection,
          },
        },
      };
    case 'SET_VERSION':
      return { ...state, version: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    default:
      return state;
  }
}

export const useCollaboration = (
  documentId: string,
  userId: string,
  username: string,
  onOperation?: (operation: Operation, version: number) => void,
  onDocumentState?: (content: string, version: number) => void
) => {
  const [state, dispatch] = useReducer(collaborationReducer, initialState);
  const onOperationRef = useRef(onOperation);
  const onDocumentStateRef = useRef(onDocumentState);

  // Update refs when callbacks change
  useEffect(() => {
    onOperationRef.current = onOperation;
    onDocumentStateRef.current = onDocumentState;
  }, [onOperation, onDocumentState]);

  // Connect to WebSocket server
  const connect = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      await webSocketService.connect(
        process.env.REACT_APP_WS_URL || 'ws://localhost:3001',
        token,
        documentId,
        userId
      );

      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Failed to connect to WebSocket server:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
      dispatch({ type: 'SET_CONNECTED', payload: false });
    }
  }, [documentId, userId]);

  // Set up event listeners
  useEffect(() => {
    // Connection status
    const handleConnect = () => {
      dispatch({ type: 'SET_CONNECTED', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
    };

    const handleDisconnect = () => {
      dispatch({ type: 'SET_CONNECTED', payload: false });
    };

    // Document state
    const handleDocumentState = (content: string, version: number) => {
      dispatch({ type: 'SET_VERSION', payload: version });
      onDocumentStateRef.current?.(content, version);
    };

    // Operations
    const handleOperation = (operation: Operation, version: number, opUserId: string) => {
      if (opUserId !== userId) {
        dispatch({ type: 'SET_VERSION', payload: version });
        onOperationRef.current?.(operation, version);
      }
    };

    // User presence
    const handleUserJoined = (id: string, username: string, color: string) => {
      if (id !== userId) {
        dispatch({ type: 'ADD_USER', payload: { id, username, color } });
      }
    };

    const handleUserLeft = (id: string) => {
      dispatch({ type: 'REMOVE_USER', payload: id });
    };

    // Cursor updates
    const handleCursorUpdate = (userId: string, cursor: CursorPosition | null, selection: SelectionRange | null) => {
      if (userId !== userId) {
        dispatch({ type: 'UPDATE_CURSOR', payload: { userId, cursor, selection } });
      }
    };

    // Error handling
    const handleError = (error: string) => {
      console.error('WebSocket error:', error);
      dispatch({ type: 'SET_ERROR', payload: error });
    };

    // Subscribe to events
    const unsubscribeDocumentState = webSocketService.onDocumentState(handleDocumentState);
    const unsubscribeOperation = webSocketService.onOperation(handleOperation);
    const unsubscribeUserJoined = webSocketService.onUserJoined(handleUserJoined);
    const unsubscribeUserLeft = webSocketService.onUserLeft(handleUserLeft);
    const unsubscribeCursorUpdate = webSocketService.onCursorUpdate(handleCursorUpdate);
    const unsubscribeError = webSocketService.onError(handleError);

    // Initial connection
    if (!webSocketService.isConnectedStatus) {
      connect();
    } else {
      handleConnect();
    }

    // Cleanup
    return () => {
      unsubscribeDocumentState();
      unsubscribeOperation();
      unsubscribeUserJoined();
      unsubscribeUserLeft();
      unsubscribeCursorUpdate();
      unsubscribeError();
      
      if (webSocketService.isConnectedStatus) {
        webSocketService.disconnect();
      }
    };
  }, [connect, userId]);

  // Send operation to server
  const sendOperation = useCallback((operation: Operation, version: number) => {
    if (webSocketService.isConnectedStatus) {
      webSocketService.sendOperation(operation, version);
      return true;
    }
    return false;
  }, []);

  // Update cursor position
  const updateCursor = useCallback((cursor: CursorPosition | null, selection: SelectionRange | null) => {
    if (webSocketService.isConnectedStatus) {
      webSocketService.updateCursor(cursor, selection);
      return true;
    }
    return false;
  }, []);

  // Set document language
  const setLanguage = useCallback((language: string) => {
    if (webSocketService.isConnectedStatus) {
      webSocketService.setLanguage(language);
      return true;
    }
    return false;
  }, []);

  // Set editor theme
  const setTheme = useCallback((theme: string) => {
    if (webSocketService.isConnectedStatus) {
      webSocketService.setTheme(theme);
      return true;
    }
    return false;
  }, []);

  // Reconnect to server
  const reconnect = useCallback(async () => {
    dispatch({ type: 'SET_ERROR', payload: null });
    await connect();
  }, [connect]);

  return {
    connected: state.connected,
    users: state.users,
    version: state.version,
    error: state.error,
    sendOperation,
    updateCursor,
    setLanguage,
    setTheme,
    reconnect,
  };
};

export default useCollaboration;
