import { renderHook, act } from '@testing-library/react-hooks';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import useCollaboration from '../useCollaboration';
import { webSocketService } from '../../services/WebSocketService';
import { Operation } from 'ot-types';

// Mock the WebSocketService
vi.mock('../../services/WebSocketService');

const mockOnOperation = vi.fn();
const mockOnDocumentState = vi.fn();

const mockSocket = {
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  connected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
};

describe('useCollaboration', () => {
  const documentId = 'test-doc-123';
  const userId = 'user-123';
  const username = 'testuser';

  beforeEach(() => {
    vi.clearAllMocks();
    (webSocketService.getSocket as jest.Mock).mockReturnValue(mockSocket);
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => 
      useCollaboration(documentId, userId, username, mockOnOperation, mockOnDocumentState)
    );

    expect(result.current.connected).toBe(false);
    expect(result.current.users).toEqual({});
    expect(result.current.version).toBe(0);
    expect(result.current.error).toBeNull();
  });

  it('should connect to the WebSocket on mount', () => {
    renderHook(() => 
      useCollaboration(documentId, userId, username, mockOnOperation, mockOnDocumentState)
    );

    expect(webSocketService.connect).toHaveBeenCalledWith(`/collaborate/${documentId}`, {
      query: { userId, username },
    });
  });

  it('should handle connection status changes', () => {
    const { result } = renderHook(() => 
      useCollaboration(documentId, userId, username, mockOnOperation, mockOnDocumentState)
    );

    // Simulate connection
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect'
      )?.[1];
      connectHandler?.();
    });

    expect(result.current.connected).toBe(true);
    expect(webSocketService.emit).toHaveBeenCalledWith('join', {
      documentId,
      userId,
      username,
    });
  });

  it('should handle operation messages', () => {
    const testOp = { type: 'insert', position: 0, text: 'test' } as Operation;
    const version = 5;
    
    renderHook(() => 
      useCollaboration(documentId, userId, username, mockOnOperation, mockOnDocumentState)
    );

    // Simulate operation message
    act(() => {
      const operationHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'operation'
      )?.[1];
      operationHandler?.({ operation: testOp, version, userId: 'other-user' });
    });

    expect(mockOnOperation).toHaveBeenCalledWith(testOp, version);
  });

  it('should handle document state messages', () => {
    const content = 'test content';
    const version = 5;
    
    renderHook(() => 
      useCollaboration(documentId, userId, username, mockOnOperation, mockOnDocumentState)
    );

    // Simulate document state message
    act(() => {
      const docStateHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'document_state'
      )?.[1];
      docStateHandler?.({ content, version });
    });

    expect(mockOnDocumentState).toHaveBeenCalledWith(content, version);
  });

  it('should clean up on unmount', () => {
    const { unmount } = renderHook(() => 
      useCollaboration(documentId, userId, username, mockOnOperation, mockOnDocumentState)
    );

    unmount();

    expect(mockSocket.off).toHaveBeenCalled();
    expect(webSocketService.disconnect).toHaveBeenCalled();
  });

  it('should handle errors', () => {
    const errorMessage = 'Connection error';
    const { result } = renderHook(() => 
      useCollaboration(documentId, userId, username, mockOnOperation, mockOnDocumentState)
    );

    // Simulate error
    act(() => {
      const errorHandler = mockSocket.on.mock.calls.find(
        call => call[0] === 'error'
      )?.[1];
      errorHandler?.({ message: errorMessage });
    });

    expect(result.current.error).toBe(errorMessage);
  });
});
