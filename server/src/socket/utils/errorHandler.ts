import { Socket } from 'socket.io';

export class SocketError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SocketError';
  }
}

export const handleSocketError = (socket: Socket, error: unknown, eventName?: string): void => {
  if (error instanceof SocketError) {
    socket.emit('error', {
      code: error.code,
      message: error.message,
      details: error.details,
    });
  } else if (error instanceof Error) {
    console.error(`Socket error${eventName ? ` in ${eventName}` : ''}:`, error);
    socket.emit('error', {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
    });
  } else {
    console.error(`Unknown socket error${eventName ? ` in ${eventName}` : ''}:`, error);
    socket.emit('error', {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
    });
  }
};

export const withErrorHandling = (
  handler: (...args: any[]) => Promise<void> | void
) => {
  return async (socket: Socket, ...args: any[]) => {
    try {
      await handler(socket, ...args);
    } catch (error) {
      handleSocketError(socket, error, handler.name);
    }
  };
};
