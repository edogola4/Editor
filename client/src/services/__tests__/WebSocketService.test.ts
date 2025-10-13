import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { WebSocketService, webSocketService } from '../WebSocketService';
import { io } from 'socket.io-client';
import { Operation } from 'ot-types';

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn((event, data, cb) => cb && cb()),
    connected: false,
    connect: vi.fn(),
    disconnect: vi.fn(),
    close: vi.fn(),
  };
  return {
    io: vi.fn(() => mockSocket),
  };
});

describe('WebSocketService', () => {
  let service: WebSocketService;
  const mockUrl = 'ws://localhost:3000';
  const mockToken = 'test-token';
  const mockDocumentId = 'test-doc-123';
  const mockUserId = 'user-123';
  const mockSocket = io();

  beforeEach(() => {
    vi.clearAllMocks();
    service = new WebSocketService();
  });

  afterEach(() => {
    service.disconnect();
  });

  describe('connect', () => {
    it('should connect to the WebSocket server', async () => {
      const connectPromise = service.connect(mockUrl, mockToken, mockDocumentId, mockUserId);
      
      // Simulate successful connection
      const connectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        (call: [string, any]) => call[0] === 'connect'
      )?.[1];
      connectHandler?.();

      await expect(connectPromise).resolves.toBeUndefined();
      expect(io).toHaveBeenCalledWith(mockUrl, {
        auth: { token: mockToken },
        query: { documentId: mockDocumentId, userId: mockUserId },
        autoConnect: false,
      });
      expect(mockSocket.connect).toHaveBeenCalled();
    });

    it('should reject if connection fails', async () => {
      const connectPromise = service.connect(mockUrl, mockToken, mockDocumentId, mockUserId);
      
      // Simulate connection error
      const errorHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        (call: [string, any]) => call[0] === 'connect_error'
      )?.[1];
      errorHandler?.({ message: 'Connection failed' });

      await expect(connectPromise).rejects.toThrow('Connection failed');
    });
  });

  describe('event handling', () => {
    beforeEach(async () => {
      await service.connect(mockUrl, mockToken, mockDocumentId, mockUserId);
      vi.clearAllMocks();
    });

    it('should handle document state events', () => {
      const mockHandler = vi.fn();
      service.onDocumentState(mockHandler);

      const documentStateHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        (call: [string, any]) => call[0] === 'document_state'
      )?.[1];
      
      const testContent = 'test content';
      const testVersion = 5;
      documentStateHandler?.({ content: testContent, version: testVersion });

      expect(mockHandler).toHaveBeenCalledWith(testContent, testVersion);
    });

    it('should handle operation events', () => {
      const mockHandler = vi.fn();
      service.onOperation(mockHandler);

      const operationHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        (call: [string, any]) => call[0] === 'operation'
      )?.[1];
      
      const testOp: Operation = { type: 'insert', position: 0, text: 'test' };
      const testVersion = 5;
      const testUserId = 'user-456';
      operationHandler?.({ operation: testOp, version: testVersion, userId: testUserId });

      expect(mockHandler).toHaveBeenCalledWith(testOp, testVersion, testUserId);
    });
  });

  describe('sending operations', () => {
    beforeEach(async () => {
      await service.connect(mockUrl, mockToken, mockDocumentId, mockUserId);
      vi.clearAllMocks();
    });

    it('should send operations', async () => {
      const testOp: Operation = { type: 'insert', position: 0, text: 'test' };
      const version = 1;
      
      await service.sendOperation(testOp, version);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('operation', {
        operation: testOp,
        version,
      }, expect.any(Function));
    });

    it('should throw if not connected', async () => {
      service.disconnect();
      const testOp: Operation = { type: 'insert', position: 0, text: 'test' };
      
      await expect(service.sendOperation(testOp, 1)).rejects.toThrow('Not connected to WebSocket');
    });
  });

  describe('disconnect', () => {
    it('should disconnect from the WebSocket server', () => {
      service.disconnect();
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });
  });

  describe('reconnection', () => {
    it('should attempt to reconnect on disconnect', async () => {
      await service.connect(mockUrl, mockToken, mockDocumentId, mockUserId);
      
      // Simulate disconnection
      const disconnectHandler = (mockSocket.on as jest.Mock).mock.calls.find(
        (call: [string, any]) => call[0] === 'disconnect'
      )?.[1];
      
      disconnectHandler?.('io server disconnect');
      
      // Should attempt to reconnect
      expect(mockSocket.connect).toHaveBeenCalledTimes(2); // Initial connect + reconnect
    });
  });

  describe('singleton instance', () => {
    it('should provide a singleton instance', () => {
      const instance1 = webSocketService;
      const instance2 = webSocketService;
      expect(instance1).toBe(instance2);
    });
  });
});
