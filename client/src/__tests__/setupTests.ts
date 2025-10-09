import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock socket.io-client
vi.mock('socket.io-client', () => {
  const mockSocket = {
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn((event, data, cb) => cb && cb({})),
    connect: vi.fn(),
    disconnect: vi.fn(),
    connected: false,
  };
  return {
    io: vi.fn(() => mockSocket),
  };
});

// Mock lodash's debounce and throttle to execute immediately
vi.mock('lodash', async () => {
  const actual = await vi.importActual('lodash');
  return {
    ...actual,
    debounce: (fn: Function) => {
      const wrapped = (...args: any[]) => fn(...args);
      wrapped.cancel = vi.fn();
      wrapped.flush = vi.fn();
      return wrapped;
    },
    throttle: (fn: Function) => {
      const wrapped = (...args: any[]) => fn(...args);
      wrapped.cancel = vi.fn();
      wrapped.flush = vi.fn();
      return wrapped;
    },
  };
});

// Mock timers
vi.useFakeTimers();

// Mock global objects
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock ResizeObserver
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.ResizeObserver = window.ResizeObserver || ResizeObserverStub;

// Mock IntersectionObserver
class IntersectionObserverStub {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}

window.IntersectionObserver = window.IntersectionObserver || IntersectionObserverStub;
