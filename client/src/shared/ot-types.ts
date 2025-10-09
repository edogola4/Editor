/**
 * Operation types for Operational Transformation (OT)
 * This file defines the core types and interfaces used for OT operations
 */

export interface Operation {
  // The type of operation (e.g., 'insert', 'delete', 'retain')
  type: string;
  
  // The position in the document where the operation applies
  position: number;
  
  // The text to insert or delete (for 'insert' and 'delete' operations)
  text?: string;
  
  // The length to retain (for 'retain' operations)
  length?: number;
  
  // Optional metadata
  [key: string]: any;
}

// Helper functions for working with operations
export const createInsertOperation = (position: number, text: string): Operation => ({
  type: 'insert',
  position,
  text,
});

export const createDeleteOperation = (position: number, text: string): Operation => ({
  type: 'delete',
  position,
  text,
});

export const createRetainOperation = (length: number): Operation => ({
  type: 'retain',
  position: 0,
  length,
});

// Document state interface
export interface DocumentState {
  // The current content of the document
  content: string;
  
  // The version number of the document
  version: number;
  
  // The ID of the document
  id: string;
  
  // The ID of the user who last modified the document
  lastModifiedBy: string;
  
  // The timestamp of the last modification
  lastModifiedAt: number;
}

// Operation metadata
export interface OperationMetadata {
  // The ID of the operation
  id: string;
  
  // The ID of the user who created the operation
  userId: string;
  
  // The timestamp when the operation was created
  timestamp: number;
  
  // The version of the document this operation applies to
  documentVersion: number;
}

// Extended operation with metadata
export interface OperationWithMetadata extends Operation {
  // The metadata for the operation
  meta: OperationMetadata;
}

// Operation result
export interface OperationResult {
  // The transformed operation
  operation: Operation;
  
  // The new document state after applying the operation
  newState: DocumentState;
  
  // Any operations that were transformed as a result of this operation
  transformedOperations: Operation[];
}

// Error types
export enum OperationErrorType {
  VERSION_MISMATCH = 'VERSION_MISMATCH',
  INVALID_OPERATION = 'INVALID_OPERATION',
  TRANSFORM_FAILED = 'TRANSFORM_FAILED',
  DOCUMENT_NOT_FOUND = 'DOCUMENT_NOT_FOUND',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
}

// Operation error
export class OperationError extends Error {
  constructor(
    public type: OperationErrorType,
    message: string,
    public operation?: Operation,
    public metadata?: OperationMetadata
  ) {
    super(message);
    this.name = 'OperationError';
  }
}

// Transformation function type
export type TransformFunction = (
  operation1: Operation,
  operation2: Operation
) => [Operation, Operation];

// Document interface
export interface Document {
  // The ID of the document
  id: string;
  
  // The current content of the document
  content: string;
  
  // The current version of the document
  version: number;
  
  // The list of operations that have been applied to the document
  operations: OperationWithMetadata[];
  
  // The ID of the user who created the document
  createdBy: string;
  
  // The timestamp when the document was created
  createdAt: number;
  
  // The ID of the user who last modified the document
  updatedBy: string;
  
  // The timestamp when the document was last modified
  updatedAt: number;
}

// Document update payload
export interface DocumentUpdatePayload {
  // The ID of the document
  documentId: string;
  
  // The operation to apply
  operation: Operation;
  
  // The version of the document this operation applies to
  documentVersion: number;
  
  // The ID of the user who created the operation
  userId: string;
}

// Document update response
export interface DocumentUpdateResponse {
  // Whether the operation was successful
  success: boolean;
  
  // The new version of the document
  newVersion: number;
  
  // Any operations that were transformed as a result of this operation
  transformedOperations: Operation[];
  
  // The new content of the document
  content: string;
  
  // Any error that occurred
  error?: {
    type: OperationErrorType;
    message: string;
  };
}

// Document subscription event types
export enum DocumentEventType {
  OPERATION_APPLIED = 'OPERATION_APPLIED',
  DOCUMENT_UPDATED = 'DOCUMENT_UPDATED',
  USER_JOINED = 'USER_JOINED',
  USER_LEFT = 'USER_LEFT',
  CURSOR_UPDATED = 'CURSOR_UPDATED',
  SELECTION_UPDATED = 'SELECTION_UPDATED',
  DOCUMENT_LOCKED = 'DOCUMENT_LOCKED',
  DOCUMENT_UNLOCKED = 'DOCUMENT_UNLOCKED',
}

// Document event payload
export interface DocumentEvent {
  // The type of event
  type: DocumentEventType;
  
  // The ID of the document
  documentId: string;
  
  // The ID of the user who triggered the event
  userId: string;
  
  // The timestamp when the event occurred
  timestamp: number;
  
  // The payload of the event
  payload: any;
}

// Cursor position
export interface CursorPosition {
  // The line number (0-based)
  line: number;
  
  // The column number (0-based)
  column: number;
  
  // The position in the document (0-based)
  position: number;
}

// Cursor update payload
export interface CursorUpdatePayload {
  // The ID of the document
  documentId: string;
  
  // The ID of the user
  userId: string;
  
  // The new cursor position
  position: CursorPosition;
  
  // The user's name
  userName: string;
  
  // The user's color
  userColor: string;
}

// Selection range
export interface SelectionRange {
  // The start position of the selection
  start: CursorPosition;
  
  // The end position of the selection
  end: CursorPosition;
  
  // The text that is selected
  text: string;
}

// Selection update payload
export interface SelectionUpdatePayload {
  // The ID of the document
  documentId: string;
  
  // The ID of the user
  userId: string;
  
  // The new selection range
  selection: SelectionRange;
  
  // The user's name
  userName: string;
  
  // The user's color
  userColor: string;
}

// User presence information
export interface UserPresence {
  // The ID of the user
  userId: string;
  
  // The name of the user
  userName: string;
  
  // The color of the user
  userColor: string;
  
  // The timestamp when the user was last active
  lastActive: number;
  
  // The current cursor position
  cursor?: CursorPosition;
  
  // The current selection
  selection?: SelectionRange;
}

// Document presence information
export interface DocumentPresence {
  // The ID of the document
  documentId: string;
  
  // The list of users currently viewing the document
  users: UserPresence[];
  
  // Whether the document is locked
  isLocked: boolean;
  
  // The ID of the user who has locked the document (if any)
  lockedBy?: string;
}
