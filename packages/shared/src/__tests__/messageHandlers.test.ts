/**
 * Message Handlers Tests
 *
 * Tests for WebSocket message handling utilities
 */

import { describe, it, expect, vi } from 'vitest';
import {
  createMessageDispatcher,
  isMessageType,
  getMessageProperty,
} from '../utils/messageHandlers';

describe('messageHandlers', () => {
  describe('createMessageDispatcher', () => {
    it('should dispatch to correct handler', () => {
      const lobbyHandler = vi.fn();
      const connectHandler = vi.fn();

      const handlers = {
        lobby_update: lobbyHandler,
        player_connected: connectHandler,
      };

      const dispatch = createMessageDispatcher(handlers);

      dispatch({ type: 'lobby_update', players: [] });
      expect(lobbyHandler).toHaveBeenCalledWith({ type: 'lobby_update', players: [] });
      expect(connectHandler).not.toHaveBeenCalled();
    });

    it('should return true when handler found', () => {
      const handlers = {
        test: vi.fn(),
      };

      const dispatch = createMessageDispatcher(handlers);
      const result = dispatch({ type: 'test' });

      expect(result).toBe(true);
    });

    it('should return false when no handler found', () => {
      const handlers = {
        test: vi.fn(),
      };

      const dispatch = createMessageDispatcher(handlers);
      const result = dispatch({ type: 'unknown' });

      expect(result).toBe(false);
    });
  });

  describe('isMessageType', () => {
    it('should return true for matching type', () => {
      const msg = { type: 'lobby_update', players: [] };
      expect(isMessageType(msg, 'lobby_update')).toBe(true);
    });

    it('should return false for non-matching type', () => {
      const msg = { type: 'lobby_update', players: [] };
      expect(isMessageType(msg, 'player_connected')).toBe(false);
    });

    it('should return false for invalid message', () => {
      expect(isMessageType(null, 'test')).toBe(false);
      expect(isMessageType(undefined, 'test')).toBe(false);
      expect(isMessageType('string', 'test')).toBe(false);
      expect(isMessageType({}, 'test')).toBe(false);
    });
  });

  describe('getMessageProperty', () => {
    it('should return property value', () => {
      const msg = { type: 'test', score: 100 };
      expect(getMessageProperty(msg, 'score', 0)).toBe(100);
    });

    it('should return default for missing property', () => {
      const msg = { type: 'test' };
      expect(getMessageProperty(msg, 'score', 0)).toBe(0);
    });

    it('should return default for undefined value', () => {
      const msg = { type: 'test', score: undefined };
      expect(getMessageProperty(msg, 'score', 0)).toBe(0);
    });
  });
});
