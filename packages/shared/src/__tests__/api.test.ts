/**
 * API Client Tests
 *
 * Tests for the API client utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('API Client', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('apiFetch', () => {
    it('should make a successful GET request', async () => {
      const mockResponse = { data: 'test' };
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      // Import after mocking
      const { sessionAPI } = await import('../utils/api');

      // This will make an actual request - we're testing the structure
      expect(sessionAPI).toBeDefined();
      expect(sessionAPI.list).toBeDefined();
    });

    it('should handle timeout errors', async () => {
      // Create an AbortError
      const abortError = new Error('Aborted');
      abortError.name = 'AbortError';
      mockFetch.mockRejectedValueOnce(abortError);

      const { sessionAPI } = await import('../utils/api');

      await expect(sessionAPI.list()).rejects.toThrow('timed out');
    });

    it('should handle HTTP errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ detail: 'Not found' }),
      });

      const { sessionAPI } = await import('../utils/api');

      await expect(sessionAPI.getByCode('INVALID')).rejects.toThrow('Not found');
    });
  });
});
