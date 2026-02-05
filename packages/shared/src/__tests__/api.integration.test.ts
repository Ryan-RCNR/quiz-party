/**
 * API Client Integration Tests
 *
 * Tests API client methods with mocked fetch responses.
 * These tests verify the integration between the API client and backend responses.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sessionAPI, questionBankAPI, playerAPI } from '../utils/api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.Clerk
Object.defineProperty(global, 'window', {
  value: {
    Clerk: null,
    location: { protocol: 'http:' },
  },
  writable: true,
});

describe('API Client Integration', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sessionAPI', () => {
    describe('list', () => {
      it('should handle array response format', async () => {
        const sessions = [
          { id: '1', name: 'Session 1', session_code: 'ABC123' },
          { id: '2', name: 'Session 2', session_code: 'DEF456' },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(sessions),
        });

        const result = await sessionAPI.list();
        expect(result).toEqual(sessions);
      });

      it('should handle wrapper object response format', async () => {
        const sessions = [{ id: '1', name: 'Session 1' }];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ sessions }),
        });

        const result = await sessionAPI.list();
        expect(result).toEqual(sessions);
      });

      it('should return empty array for empty response', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({}),
        });

        const result = await sessionAPI.list();
        expect(result).toEqual([]);
      });
    });

    describe('create', () => {
      it('should create session with correct params', async () => {
        const params = {
          name: 'Test Session',
          question_bank_id: 'bank-1',
          preset: 'standard',
          chaos_level: 'chill',
          team_count: 4,
        };

        const response = {
          session_code: 'XYZ789',
          session_id: 'session-1',
          join_url: 'http://example.com/join/XYZ789',
          host_url: 'http://example.com/host/XYZ789',
          game_sequence: ['speed_race', 'knockout'],
          preset: 'standard',
          chaos_level: 'chill',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(response),
        });

        const result = await sessionAPI.create(params);
        expect(result).toEqual(response);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/quizparty/sessions'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify(params),
          })
        );
      });
    });

    describe('getByCode', () => {
      it('should fetch session by code', async () => {
        const session = {
          id: '1',
          name: 'Test Session',
          session_code: 'ABC123',
          status: 'lobby',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(session),
        });

        const result = await sessionAPI.getByCode('ABC123');
        expect(result).toEqual(session);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/quizparty/sessions/ABC123'),
          expect.any(Object)
        );
      });

      it('should throw error for non-existent session', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ detail: 'Session not found' }),
        });

        await expect(sessionAPI.getByCode('INVALID')).rejects.toThrow('Session not found');
      });
    });
  });

  describe('questionBankAPI', () => {
    describe('list', () => {
      it('should handle array response', async () => {
        const banks = [
          { id: '1', name: 'Math Quiz', question_count: 10 },
          { id: '2', name: 'Science Quiz', question_count: 15 },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(banks),
        });

        const result = await questionBankAPI.list();
        expect(result).toEqual(banks);
      });

      it('should handle wrapper object response', async () => {
        const banks = [{ id: '1', name: 'Math Quiz' }];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ banks }),
        });

        const result = await questionBankAPI.list();
        expect(result).toEqual(banks);
      });
    });

    describe('get', () => {
      it('should fetch bank with questions', async () => {
        const bank = {
          id: '1',
          name: 'Math Quiz',
          questions: [
            { id: 'q1', question_text: 'What is 2+2?', options: ['3', '4', '5'], correct_index: 1 },
          ],
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(bank),
        });

        const result = await questionBankAPI.get('1');
        expect(result).toEqual(bank);
      });
    });
  });

  describe('playerAPI', () => {
    describe('join', () => {
      it('should join session and return player info', async () => {
        const response = {
          player_id: 'player-1',
          player_token: 'token-abc',
          display_name: 'TestPlayer',
          session_code: 'ABC123',
          team_id: 'team-1',
          team_name: 'Red Team',
          status: 'joined',
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve(response),
        });

        const result = await playerAPI.join('ABC123', 'TestPlayer');
        expect(result).toEqual(response);
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('/api/quizparty/sessions/ABC123/join'),
          expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ display_name: 'TestPlayer' }),
          })
        );
      });

      it('should throw error for full session', async () => {
        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 400,
          json: () => Promise.resolve({ detail: 'Session is full' }),
        });

        await expect(playerAPI.join('ABC123', 'Player')).rejects.toThrow('Session is full');
      });
    });

    describe('session storage', () => {
      beforeEach(() => {
        sessionStorage.clear();
      });

      it('should store and retrieve session', () => {
        const session = {
          playerId: 'p1',
          playerToken: 'token',
          displayName: 'Player',
          sessionCode: 'ABC123',
          teamId: null,
          teamName: null,
        };

        playerAPI.storeSession(session);
        const retrieved = playerAPI.getStoredSession();

        expect(retrieved).toEqual(session);
      });

      it('should return null for no stored session', () => {
        const result = playerAPI.getStoredSession();
        expect(result).toBeNull();
      });

      it('should clear session', () => {
        playerAPI.storeSession({
          playerId: 'p1',
          playerToken: 'token',
          displayName: 'Player',
          sessionCode: 'ABC123',
          teamId: null,
          teamName: null,
        });

        playerAPI.clearSession();
        expect(playerAPI.getStoredSession()).toBeNull();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(sessionAPI.list()).rejects.toThrow('Network error');
    });

    it('should handle timeout', async () => {
      mockFetch.mockImplementationOnce(() => new Promise((_, reject) => {
        const error = new Error('Request timed out after 10000ms');
        error.name = 'AbortError';
        setTimeout(() => reject(error), 100);
      }));

      await expect(sessionAPI.list()).rejects.toThrow();
    });

    it('should handle JSON parse errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.reject(new Error('Invalid JSON')),
        text: () => Promise.resolve('Invalid response'),
      });

      // Should throw or handle gracefully
      await expect(sessionAPI.list()).rejects.toThrow();
    });
  });
});
