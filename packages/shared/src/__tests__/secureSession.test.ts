/**
 * Secure Session Tests
 *
 * Tests for the secure session manager
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  storeSecureSession,
  getSecureSession,
  getSessionMetadata,
  getPlayerToken,
  hasValidSession,
  clearSecureSession,
  refreshSessionExpiry,
} from '../utils/secureSession';

describe('secureSession', () => {
  beforeEach(() => {
    clearSecureSession();
    sessionStorage.clear();
  });

  describe('storeSecureSession', () => {
    it('should store session in memory', () => {
      const session = {
        playerId: 'player-123',
        playerToken: 'secret-token',
        displayName: 'TestPlayer',
        sessionCode: 'ABC123',
        teamId: null,
        teamName: null,
      };

      storeSecureSession(session);

      const stored = getSecureSession();
      expect(stored).not.toBeNull();
      expect(stored?.playerId).toBe('player-123');
      expect(stored?.playerToken).toBe('secret-token');
    });

    it('should store metadata in sessionStorage without token', () => {
      const session = {
        playerId: 'player-123',
        playerToken: 'secret-token',
        displayName: 'TestPlayer',
        sessionCode: 'ABC123',
        teamId: null,
        teamName: null,
      };

      storeSecureSession(session);

      // Check sessionStorage doesn't have token
      const metadata = getSessionMetadata();
      expect(metadata).not.toBeNull();
      expect(metadata?.playerId).toBe('player-123');
      expect(metadata?.displayName).toBe('TestPlayer');

      // Token should NOT be in sessionStorage
      const rawStored = sessionStorage.getItem('quizparty_session_meta');
      expect(rawStored).not.toBeNull();
      expect(rawStored).not.toContain('secret-token');
    });
  });

  describe('getPlayerToken', () => {
    it('should return token from memory', () => {
      const session = {
        playerId: 'player-123',
        playerToken: 'secret-token',
        displayName: 'TestPlayer',
        sessionCode: 'ABC123',
        teamId: null,
        teamName: null,
      };

      storeSecureSession(session);
      expect(getPlayerToken()).toBe('secret-token');
    });

    it('should return null when no session', () => {
      expect(getPlayerToken()).toBeNull();
    });
  });

  describe('hasValidSession', () => {
    it('should return true when session exists', () => {
      storeSecureSession({
        playerId: 'player-123',
        playerToken: 'token',
        displayName: 'Test',
        sessionCode: 'ABC123',
        teamId: null,
        teamName: null,
      });

      expect(hasValidSession()).toBe(true);
    });

    it('should return false when no session', () => {
      expect(hasValidSession()).toBe(false);
    });
  });

  describe('clearSecureSession', () => {
    it('should clear memory and sessionStorage', () => {
      storeSecureSession({
        playerId: 'player-123',
        playerToken: 'token',
        displayName: 'Test',
        sessionCode: 'ABC123',
        teamId: null,
        teamName: null,
      });

      clearSecureSession();

      expect(getSecureSession()).toBeNull();
      expect(getSessionMetadata()).toBeNull();
      expect(getPlayerToken()).toBeNull();
    });
  });

  describe('session expiration', () => {
    it('should set expiration on store', () => {
      storeSecureSession({
        playerId: 'player-123',
        playerToken: 'token',
        displayName: 'Test',
        sessionCode: 'ABC123',
        teamId: null,
        teamName: null,
      });

      const session = getSecureSession();
      expect(session?.expiresAt).toBeDefined();
      expect(session!.expiresAt! > Date.now()).toBe(true);
    });

    it('should return null for expired session', () => {
      storeSecureSession({
        playerId: 'player-123',
        playerToken: 'token',
        displayName: 'Test',
        sessionCode: 'ABC123',
        teamId: null,
        teamName: null,
      });

      // Mock time to be past expiration
      vi.useFakeTimers();
      vi.advanceTimersByTime(5 * 60 * 60 * 1000); // 5 hours

      expect(getSecureSession()).toBeNull();

      vi.useRealTimers();
    });
  });
});
