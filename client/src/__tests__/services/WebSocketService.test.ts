import { WebSocketService } from '../../../src/services/WebSocketService';
import { io } from 'socket.io-client';
import { Mock } from 'vitest';

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  const emit = vi.fn();
  const on = vi.fn((event, callback) => {
    if (event === 'connect') {
      setTimeout(() => callback(), 10);
    }
    return { emit, on };
  });
  const disconnect = vi.fn();
  
  return {
    io: vi.fn(() => ({
      on,
      emit,
      disconnect,
      connected: true,
    })),
  };
});

describe('WebSocketService', () => {
  let webSocketService: WebSocketService;
  const mockEmit = io().emit as Mock;
  const mockOn = io().on as Mock;
  const mockDisconnect = io().disconnect as Mock;

  beforeEach(() => {
    webSocketService = new WebSocketService();
    vi.clearAllMocks();
  });

  afterEach(() => {
    webSocketService.disconnect();
  });

  describe('connect', () => {
    it('should connect to WebSocket server', async () => {
      const connectPromise = webSocketService.connect(
        'ws://localhost:3001',
        'test-token',
        'test-doc',
        'user-1'
      );
      
      await expect(connectPromise).resolves.toBeUndefined();
      expect(mockOn).toHaveBeenCalledWith('connect', expect.any(Function));
      expect(webSocketService.isConnectedStatus).toBe(true);
    });

    it('should handle connection errors', async () => {
      const error = new Error('Connection failed');
      mockOn.mockImplementationOnce((event, callback) => {
        if (event === 'connect_error') {
          callback(error);
        }
        return { on: mockOn };
      });

      await expect(
        webSocketService.connect('ws://localhost:3001', 'test-token', 'test-doc', 'user-1')
      ).rejects.toThrow('Connection failed');
    });
  });

  describe('sendOperation', () => {
    beforeEach(async () => {
      await webSocketService.connect('ws://localhost:3001', 'test-token', 'test-doc', 'user-1');
    });

    it('should send operation to server', () => {
      const operation = ['insert', 'Hello'];
      const version = 1;
      
      const result = webSocketService.sendOperation(operation, version);
      
      expect(result).toBe(true);
      expect(mockEmit).toHaveBeenCalledWith('operation', {
        documentId: 'test-doc',
        operation,
        version,
      });
    });
  });

  describe('updateCursor', () => {
    beforeEach(async () => {
      await webSocketService.connect('ws://localhost:3001', 'test-token', 'test-doc', 'user-1');
    });

    it('should send cursor update to server', () => {
      const cursor = { row: 0, column: 5 };
      const selection = { start: cursor, end: cursor };
      
      const result = webSocketService.updateCursor(cursor, selection);
      
      expect(result).toBe(true);
      expect(mockEmit).toHaveBeenCalledWith('cursor:update', {
        documentId: 'test-doc',
        cursor,
        selection,
      });
    });
  });

  describe('event listeners', () => {
    let operationHandler: (op: any, v: number, id: string) => void;
    let cursorHandler: (id: string, cursor: any, selection: any) => void;
    
    beforeEach(async () => {
      mockOn.mockImplementation((event, callback) => {
        if (event === 'operation') operationHandler = callback;
        if (event === 'cursor:update') cursorHandler = callback;
        return { on: mockOn };
      });

      await webSocketService.connect('ws://localhost:3001', 'test-token', 'test-doc', 'user-1');
    });

    it('should handle operation events', () => {
      const operation = ['insert', 'Hello'];
      const version = 1;
      const userId = 'user-2';
      
      const handler = vi.fn();
      webSocketService.onOperation(handler);
      
      operationHandler?.(operation, version, userId);
      
      expect(handler).toHaveBeenCalledWith(operation, version, userId);
    });

    it('should handle cursor update events', () => {
      const cursor = { row: 0, column: 5 };
      const selection = { start: cursor, end: cursor };
      const userId = 'user-2';
      
      const handler = vi.fn();
      webSocketService.onCursorUpdate(handler);
      
      cursorHandler?.(userId, cursor, selection);
      
      expect(handler).toHaveBeenCalledWith(userId, cursor, selection);
    });
  });
});
