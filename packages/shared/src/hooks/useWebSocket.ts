/**
 * Quiz Party WebSocket Hook
 *
 * Handles connection, reconnection, and message routing for both host and player roles
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import type { HostWSMessage, PlayerWSMessage } from '../types';

// WebSocket connection constants
const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 15000;
const MAX_RECONNECT_ATTEMPTS = 10;

// Message type union for WebSocket communication
export type WebSocketMessageData = HostWSMessage | PlayerWSMessage;

// Outbound message types (client to server)
export interface WSOutboundInit {
  type: 'init';
  role: 'host' | 'player';
  token?: string;
  player_id?: string;
  player_token?: string;
}

export interface WSOutboundAnswer {
  type: 'submit_answer';
  question_id: string;
  answer_index: number;
}

export interface WSOutboundHostAction {
  type: 'start_game' | 'next_question' | 'pause' | 'resume' | 'end_session';
}

export type WSOutboundMessage = WSOutboundInit | WSOutboundAnswer | WSOutboundHostAction | { type: 'pong' };

interface UseWebSocketOptions<T extends WebSocketMessageData = WebSocketMessageData> {
  sessionCode: string;
  role: 'host' | 'player';
  token?: string;
  playerId?: string;
  playerToken?: string;
  onMessage?: (data: T) => void;
  onError?: (error: Event) => void;
  onReconnectExhausted?: () => void;
  enabled?: boolean;
  wsUrl?: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  send: (data: WSOutboundMessage | Record<string, unknown>) => void;
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
}

export function useWebSocket<T extends WebSocketMessageData = WebSocketMessageData>({
  sessionCode,
  role,
  token,
  playerId,
  playerToken,
  onMessage,
  onError,
  onReconnectExhausted,
  enabled = true,
  wsUrl,
}: UseWebSocketOptions<T>): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<UseWebSocketReturn['connectionStatus']>('disconnected');
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageQueue = useRef<(WSOutboundMessage | Record<string, unknown>)[]>([]);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onReconnectExhaustedRef = useRef(onReconnectExhausted);
  onMessageRef.current = onMessage;
  onErrorRef.current = onError;
  onReconnectExhaustedRef.current = onReconnectExhausted;

  const connect = useCallback(() => {
    if (!enabled || !sessionCode) return;

    // Determine WebSocket URL with secure defaults
    const getDefaultWsUrl = () => {
      if (typeof window === 'undefined') return 'ws://localhost:8000';
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In production, use the current host; in development, use localhost
      const host = import.meta.env.DEV ? 'localhost:8000' : window.location.host;
      return `${protocol}//${host}`;
    };
    const baseUrl = wsUrl || import.meta.env.VITE_WS_URL || getDefaultWsUrl();
    const url = `${baseUrl}/ws/quizparty/${sessionCode}`;
    setConnectionStatus(reconnectAttempts.current > 0 ? 'reconnecting' : 'connecting');

    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;

      // Send init message based on role
      const initMsg: Record<string, unknown> = { type: 'init', role };
      if (role === 'host' && token) {
        initMsg.token = token;
      } else if (role === 'player' && playerId) {
        initMsg.player_id = playerId;
        initMsg.player_token = playerToken;
      }
      ws.send(JSON.stringify(initMsg));

      // Flush message queue
      for (const msg of messageQueue.current) {
        ws.send(JSON.stringify(msg));
      }
      messageQueue.current = [];
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        // Basic validation: must be an object with a type property
        if (typeof data !== 'object' || data === null || typeof data.type !== 'string') {
          if (import.meta.env.DEV) {
            console.warn('Invalid WebSocket message format:', data);
          }
          return;
        }

        // Handle ping with pong
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        onMessageRef.current?.(data as T);
      } catch (error) {
        // Invalid JSON
        if (import.meta.env.DEV) {
          console.warn('Failed to parse WebSocket message:', error);
        }
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      wsRef.current = null;

      if (enabled && reconnectAttempts.current < MAX_RECONNECT_ATTEMPTS) {
        const delay = Math.min(
          INITIAL_RECONNECT_DELAY_MS * Math.pow(2, reconnectAttempts.current),
          MAX_RECONNECT_DELAY_MS
        );
        reconnectAttempts.current += 1;
        setConnectionStatus('reconnecting');
        reconnectTimer.current = setTimeout(connect, delay);
      } else {
        setConnectionStatus('disconnected');
        // Notify parent that reconnection attempts have been exhausted
        if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
          onReconnectExhaustedRef.current?.();
        }
      }
    };

    ws.onerror = (error) => {
      // Log error for debugging (onclose will handle reconnection)
      if (import.meta.env.DEV) {
        console.error('WebSocket error:', error);
      }
      // Notify parent component if callback provided
      onErrorRef.current?.(error);
    };
  }, [enabled, sessionCode, role, token, playerId, playerToken, wsUrl]);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const send = useCallback((data: WSOutboundMessage | Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      messageQueue.current.push(data);
    }
  }, []);

  return { isConnected, send, connectionStatus };
}

