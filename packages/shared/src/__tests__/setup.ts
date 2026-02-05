/**
 * Vitest Setup File
 *
 * Global test setup and mocks
 */

import { vi } from 'vitest';

// Mock import.meta.env
vi.stubGlobal('import.meta', {
  env: {
    DEV: true,
    VITE_API_URL: 'http://localhost:8000',
    VITE_WS_URL: 'ws://localhost:8000',
  },
});

// Mock sessionStorage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

vi.stubGlobal('sessionStorage', sessionStorageMock);

// Mock WebSocket
class MockWebSocket {
  url: string;
  readyState: number = 0;
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((event: { data: string }) => void) | null = null;
  onerror: ((event: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    // Simulate connection after a tick
    setTimeout(() => {
      this.readyState = 1;
      this.onopen?.();
    }, 0);
  }

  send(_data: string) {
    // Mock send
  }

  close() {
    this.readyState = 3;
    this.onclose?.();
  }

  // Helper to simulate receiving a message
  _receiveMessage(data: unknown) {
    this.onmessage?.({ data: JSON.stringify(data) });
  }
}

vi.stubGlobal('WebSocket', MockWebSocket);
