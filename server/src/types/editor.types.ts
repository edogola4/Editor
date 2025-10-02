// Core editor operation types
export interface Operation {
  type: 'insert' | 'delete' | 'retain';
  position: number;
  text?: string;
  length?: number;
  version: number;
  userId: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

export interface CursorPosition {
  line: number;
  ch: number;
  sticky?: string | null;
  xRel?: number;
  [key: string]: any;
}

export interface SelectionRange {
  anchor: CursorPosition;
  head: CursorPosition;
}

export interface UserPresence {
  userId: string;
  username: string;
  color: string;
  cursor?: CursorPosition;
  selection?: SelectionRange;
  lastActive: number;
  avatar?: string;
}

export interface DocumentState {
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  language: string;
  theme: string;
  users: Record<string, UserPresence>;
}

// Socket event types
export interface EditorEvent {
  type: 'operation' | 'cursor' | 'selection' | 'presence' | 'sync' | 'error';
  payload: any;
  timestamp: number;
}

export interface OperationEvent extends EditorEvent {
  type: 'operation';
  payload: {
    operations: Operation[];
    version: number;
    source: string;
  };
}

export interface CursorEvent extends EditorEvent {
  type: 'cursor';
  payload: {
    userId: string;
    position: CursorPosition;
    color: string;
  };
}

export interface SelectionEvent extends EditorEvent {
  type: 'selection';
  payload: {
    userId: string;
    selection: SelectionRange;
    color: string;
  };
}

export interface PresenceEvent extends EditorEvent {
  type: 'presence';
  payload: {
    users: Record<string, UserPresence>;
  };
}

export interface SyncEvent extends EditorEvent {
  type: 'sync';
  payload: {
    version: number;
    state: string;
    operations: Operation[];
  };
}

// Configuration types
export interface EditorConfig {
  debounceTime?: number;
  batchSize?: number;
  maxDocumentSize?: number;
  operationHistoryLimit?: number;
  presenceTimeout?: number;
}

// Error types
export class EditorError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'EditorError';
  }
}

export const EditorErrorCodes = {
  DOCUMENT_NOT_FOUND: 'DOCUMENT_NOT_FOUND',
  VERSION_CONFLICT: 'VERSION_CONFLICT',
  OPERATION_REJECTED: 'OPERATION_REJECTED',
  INVALID_OPERATION: 'INVALID_OPERATION',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  DOCUMENT_TOO_LARGE: 'DOCUMENT_TOO_LARGE',
  RATE_LIMITED: 'RATE_LIMITED',
} as const;
