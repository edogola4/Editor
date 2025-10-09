import { describe, it, expect, vi, beforeEach, afterEach, beforeAll, afterAll, Mock } from 'vitest';
import { EnhancedSocketService, createEnhancedSocketService } from '../EnhancedSocketService';
import { SocketEvent } from '../types';

// Mock the entire socket.io-client module
const mockIo = vi.fn();
vi.mock('socket.io-client', () => ({
  io: mockIo,
}));

type MockSocket = {
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  hasListeners: ReturnType<typeof vi.fn>;
  connected: boolean;
};

// Mock socket implementation
const createMockSocket = (): MockSocket => {
  const socket: any = {
    on: vi.fn((event: string, callback: Function) => {
      // Automatically call connect handler if it's a connect event
      if (event === 'connect') {
        socket.connected = true;
        setTimeout(() => callback?.(), 0);
      }
      return socket;
    }),
    off: vi.fn().mockImplementation(() => socket),
    emit: vi.fn((event: string, data: any, cb?: Function) => {
      if (cb) {
        setTimeout(() => cb({ success: true }), 0);
      }
      return socket;
    }),
    connect: vi.fn().mockImplementation(() => {
      socket.connected = true;
      const connectHandler = (socket.on as Mock).mock.calls
        .find((call: any) => call[0] === 'connect')?.[1];
      if (connectHandler) {
        setTimeout(connectHandler, 0);
      }
      return socket;
    }),
    disconnect: vi.fn().mockImplementation(() => {
      socket.connected = false;
      return socket;
    }),
    hasListeners: vi.fn().mockReturnValue(false),
    connected: false,
  };
  return socket;
};

let mockSocket: MockSocket;

describe('EnhancedSocketService', () => {
  let socketService: EnhancedSocketService;
  let mockSocket: MockSocket;

  beforeAll(() => {
    // Mock timers for testing time-based functions
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create a fresh mock socket for each test
    mockSocket = createMockSocket();
    
    // Mock the io function to return our mock socket
    mockIo.mockReturnValue(mockSocket);
    
    // Create a new instance for each test
    socketService = new EnhancedSocketService({
      url: 'http://test.com',
      autoConnect: false,
    });
  });

  afterEach(() => {
    // Clean up after each test
    socketService.dispose();
  });

  describe('connection management', () => {
    it('should initialize with default state', () => {
      expect(socketService.state).toEqual({
        isConnected: false,
        isConnecting: false,
        isReconnecting: false,
        reconnectAttempts: 0,
        latency: 0,
        error: null,
      });
    });

    it('should connect to socket server', async () => {
      const connectPromise = socketService.connect();
      
      // Simulate successful connection
      const connectHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'connect'
      )?.[1];
      connectHandler?.();
      
      await connectPromise;
      
      expect(mockSocket.connect).toHaveBeenCalled();
      expect(socketService.state.isConnected).toBe(true);
      expect(socketService.state.isConnecting).toBe(false);
    });

    it('should handle connection errors', async () => {
      const errorSpy = vi.fn();
      socketService.on(SocketEvent.ERROR, errorSpy);
      
      // Mock connection to throw an error
      mockSocket.connect.mockImplementationOnce(() => {
        const errorHandler = mockSocket.on.mock.calls.find(
          ([event]) => event === 'connect_error'
        )?.[1];
        if (errorHandler) {
          errorHandler(new Error('Connection failed'));
        }
        return mockSocket;
      });
      
      await expect(socketService.connect()).rejects.toThrow('Connection failed');
      expect(errorSpy).toHaveBeenCalled();
      expect(socketService.state.error).toBeDefined();
    });
  });

  describe('event handling', () => {
    it('should register and unregister event listeners', () => {
      const handler = vi.fn();
      
      // Register event listener
      const unsubscribe = socketService.on(SocketEvent.DOCUMENT_CHANGE, handler);
      
      // Simulate event from socket
      const docChangeHandler = (mockSocket.on as Mock).mock.calls
        .find((call: any) => call[0] === SocketEvent.DOCUMENT_CHANGE)?.[1];
      const testData = { operation: 'test' };
      docChangeHandler?.(testData);
      
      expect(handler).toHaveBeenCalledWith(testData);
      
      // Test unsubscribing
      handler.mockClear();
      unsubscribe();
      docChangeHandler?.(testData);
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle custom events', () => {
      const testEvent = 'custom:event' as SocketEvent;
      const handler = vi.fn();
      const testData = { data: 'test' };
      
      socketService.on(testEvent, handler);
      
      // Simulate custom event
      const eventHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === testEvent
      )?.[1];
      eventHandler?.(testData);
      
      expect(handler).toHaveBeenCalledWith(testData);
    });
  });

  describe('operation queue', () => {
    it('should queue operations when disconnected', async () => {
      const operation = { type: 'insert', position: 0, text: 'test' };
      
      // Mock emit to track calls
      const emitSpy = vi.spyOn(mockSocket, 'emit');
      
      // Send operation while disconnected
      const result = socketService.sendOperation(operation);
      
      // Operation should be queued
      expect(emitSpy).not.toHaveBeenCalled();
      
      // Connect and process queue
      mockSocket.connected = true;
      const connectHandler = mockSocket.on.mock.calls.find(
        ([event]) => event === 'connect'
      )?.[1];
      connectHandler?.();
      
      // Should process queued operation
      expect(emitSpy).toHaveBeenCalledWith(
        SocketEvent.DOCUMENT_CHANGE,
        operation,
        expect.any(Function)
      );
      
      await expect(result).resolves.toBeUndefined();
      
      // Clean up
      emitSpy.mockRestore();
    });
    
    it('should process operations immediately when connected', async () => {
      // First connect
      await socketService.connect();
      
      const operation = { type: 'insert', position: 0, text: 'test' };
      const result = socketService.sendOperation(operation);
      
      // Should process immediately
      expect(mockSocket.emit).toHaveBeenCalledWith(
        SocketEvent.DOCUMENT_CHANGE,
        operation,
        expect.any(Function)
      );
      
      await expect(result).resolves.toBeUndefined();
    });
  });

  describe('reconnection', () => {
    it('should attempt reconnection with exponential backoff', async () => {
      // Set up mock for reconnection attempts
      let reconnectAttempts = 0;
      const maxAttempts = 3;
      
      mockSocket.connect.mockImplementation(() => {
        reconnectAttempts++;
        if (reconnectAttempts <= maxAttempts) {
          const errorHandler = mockSocket.on.mock.calls.find(
            ([event]) => event === 'connect_error'
          )?.[1];
          errorHandler?.(new Error('Connection failed'));
        } else {
          const connectHandler = mockSocket.on.mock.calls.find(
            ([event]) => event === 'connect'
          )?.[1];
          connectHandler?.();
        }
        return mockSocket;
      });
      
      // Enable reconnection with custom settings
      socketService = new EnhancedSocketService({
        url: 'http://test.com',
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: maxAttempts,
        reconnectionDelay: 100,
      });
      
      // Wait for reconnection attempts
      await vi.runAllTimersAsync();
      
      // Should have attempted to reconnect maxAttempts times
      expect(mockSocket.connect).toHaveBeenCalledTimes(maxAttempts + 1); // +1 for initial connection
      expect(socketService.state.reconnectAttempts).toBe(maxAttempts);
    });
  });
  
  describe('cleanup', () => {
    it('should clean up resources on dispose', () => {
      // First connect to set up event listeners
      socketService.connect();
      
      // Then dispose
      socketService.dispose();
      
      // Should remove all event listeners and disconnect
      expect(mockSocket.off).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
      
      // Should not be able to use the service after disposal
      expect(() => socketService.connect()).toThrow('SocketService has been disposed');
    });
  });
  
  describe('throttling and debouncing', () => {
    it('should throttle cursor updates', async () => {
      // First connect
      await socketService.connect();
      
      // Mock emit for this test
      const emitSpy = vi.spyOn(mockSocket, 'emit');
      
      // Send multiple cursor updates in quick succession
      const cursor1 = { x: 10, y: 20 };
      const cursor2 = { x: 15, y: 25 };
      const cursor3 = { x: 20, y: 30 };
      
      socketService.sendCursorUpdate(cursor1);
      socketService.sendCursorUpdate(cursor2);
      socketService.sendCursorUpdate(cursor3);
      
      // Should only emit once due to throttling
      expect(emitSpy).toHaveBeenCalledTimes(1);
      expect(emitSpy).toHaveBeenCalledWith(
        SocketEvent.CURSOR_UPDATE,
        cursor1, // First update should be the one that gets through
        expect.any(Function)
      );
      
      // Clean up
      emitSpy.mockRestore();
    });
  });
    });
  });

  describe('cleanup', () => {
    it('should clean up resources on dispose', () => {
      socketService.dispose();
      
      expect(mockSocket.off).toHaveBeenCalled();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('throttling and debouncing', () => {
    it('should throttle cursor updates', async () => {
      // Connect first
      mockSocket.connected = true;
      const connectHandler = mockSocket.on.mock.calls.find(
        ([event]: [string]) => event === 'connect'
      )?.[1];
      connectHandler?.();
      
      // Send multiple cursor updates
      for (let i = 0; i < 5; i++) {
        socketService.sendCursorUpdate({ x: i, y: i });
      }
      
      // Should only emit once due to throttling
      expect(mockSocket.emit).toHaveBeenCalledTimes(1);
    });
  });
});

describe('createEnhancedSocketService', () => {
  it('should create a new instance of EnhancedSocketService', () => {
    const service = createEnhancedSocketService({ url: 'http://test.com' });
    expect(service).toBeInstanceOf(EnhancedSocketService);
  });
});
