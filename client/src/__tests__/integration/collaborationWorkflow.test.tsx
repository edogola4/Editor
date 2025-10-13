import React from 'react';
import { render, screen, act, waitFor } from '../../__tests__/test-utils';
import { WebSocketService } from '../../services/WebSocketService';
import { useCollaboration } from '../../hooks/useCollaboration';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

// Mock the WebSocketService
vi.mock('../../services/WebSocketService');

// Test component that uses the useCollaboration hook
const TestComponent = ({ onOperation, onDocumentState }: { 
  onOperation?: (op: any, version: number) => void,
  onDocumentState?: (content: string, version: number) => void 
}) => {
  const { connected, users, version, error } = useCollaboration(
    'test-doc-123',
    'user-123',
    'testuser',
    onOperation,
    onDocumentState
  );

  return (
    <div>
      <div data-testid="status">{connected ? 'Connected' : 'Disconnected'}</div>
      <div data-testid="version">Version: {version}</div>
      <div data-testid="user-count">Users: {Object.keys(users).length}</div>
      {error && <div data-testid="error">{error}</div>}
    </div>
  );
};

describe('Collaboration Workflow', () => {
  let mockSocket: any;
  let mockOnOperation: ReturnType<typeof vi.fn>;
  let mockOnDocumentState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    mockOnOperation = vi.fn();
    mockOnDocumentState = vi.fn();
    
    // Setup mock WebSocket
    mockSocket = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn((event, data, cb) => cb && cb()),
      connected: false,
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
    
    (WebSocketService as any).mockImplementation(() => ({
      connect: vi.fn(() => Promise.resolve()),
      disconnect: vi.fn(),
      onOperation: vi.fn(),
      offOperation: vi.fn(),
      onDocumentState: vi.fn(),
      offDocumentState: vi.fn(),
      onUserJoined: vi.fn(),
      offUserJoined: vi.fn(),
      onUserLeft: vi.fn(),
      offUserLeft: vi.fn(),
      onCursorChange: vi.fn(),
      offCursorChange: vi.fn(),
      sendOperation: vi.fn(),
      updateCursor: vi.fn(),
      getSocket: vi.fn(() => mockSocket),
    }));
  });

  it('should connect to the WebSocket and handle collaboration events', async () => {
    render(
      <TestComponent 
        onOperation={mockOnOperation} 
        onDocumentState={mockOnDocumentState} 
      />
    );

    // Initial state
    expect(screen.getByTestId('status')).toHaveTextContent('Disconnected');
    expect(screen.getByTestId('version')).toHaveTextContent('Version: 0');
    expect(screen.getByTestId('user-count')).toHaveTextContent('Users: 0');

    // Simulate WebSocket connection
    act(() => {
      const connectHandler = mockSocket.on.mock.calls.find(
        (call: [string, any]) => call[0] === 'connect'
      )?.[1];
      connectHandler?.();
    });

    // Should be connected after WebSocket connects
    expect(screen.getByTestId('status')).toHaveTextContent('Connected');

    // Simulate user joining
    act(() => {
      const userJoinedHandler = mockSocket.on.mock.calls.find(
        (call: [string, any]) => call[0] === 'user_joined'
      )?.[1];
      userJoinedHandler?.({ userId: 'user-456', username: 'anotheruser', color: '#ff0000' });
    });

    // Should show the new user
    expect(screen.getByTestId('user-count')).toHaveTextContent('Users: 1');

    // Simulate document state update
    act(() => {
      const docStateHandler = mockSocket.on.mock.calls.find(
        (call: [string, any]) => call[0] === 'document_state'
      )?.[1];
      docStateHandler?.({ content: 'Hello, world!', version: 5 });
    });

    // Should call the document state handler with the new content
    expect(mockOnDocumentState).toHaveBeenCalledWith('Hello, world!', 5);
    expect(screen.getByTestId('version')).toHaveTextContent('Version: 5');

    // Simulate operation
    act(() => {
      const operationHandler = mockSocket.on.mock.calls.find(
        (call: [string, any]) => call[0] === 'operation'
      )?.[1];
      operationHandler?.({ 
        operation: { type: 'insert', position: 5, text: ' there' }, 
        version: 6,
        userId: 'user-456'
      });
    });

    // Should call the operation handler with the operation
    expect(mockOnOperation).toHaveBeenCalledWith(
      { type: 'insert', position: 5, text: ' there' },
      6,
      'user-456'
    );
  });

  it('should handle disconnection and errors', async () => {
    render(
      <TestComponent 
        onOperation={mockOnOperation} 
        onDocumentState={mockOnDocumentState} 
      />
    );

    // Simulate error
    act(() => {
      const errorHandler = mockSocket.on.mock.calls.find(
        (call: [string, any]) => call[0] === 'error'
      )?.[1];
      errorHandler?.({ message: 'Connection error' });
    });

    // Should show error
    expect(screen.getByTestId('error')).toHaveTextContent('Connection error');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });
});
