/**
 * Quiz Party WebSocket Hook
 *
 * Handles connection, reconnection, and message routing for both host and player roles
 */

import { useEffect, useRef, useState, useCallback } from 'react';

// WebSocket connection constants
const INITIAL_RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 15000;
const MAX_RECONNECT_ATTEMPTS = 10;

interface UseWebSocketOptions {
  sessionCode: string;
  role: 'host' | 'player';
  token?: string;
  playerId?: string;
  playerToken?: string;
  onMessage?: (data: Record<string, unknown>) => void;
  onError?: (error: Event) => void;
  onReconnectExhausted?: () => void;
  enabled?: boolean;
  wsUrl?: string;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  send: (data: Record<string, unknown>) => void;
  connectionStatus: 'connecting' | 'connected' | 'reconnecting' | 'disconnected';
}

export function useWebSocket({
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
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<UseWebSocketReturn['connectionStatus']>('disconnected');
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const messageQueue = useRef<Record<string, unknown>[]>([]);
  const onMessageRef = useRef(onMessage);
  const onErrorRef = useRef(onError);
  const onReconnectExhaustedRef = useRef(onReconnectExhausted);
  onMessageRef.current = onMessage;
  onErrorRef.current = onError;
  onReconnectExhaustedRef.current = onReconnectExhausted;

  const connect = useCallback(() => {
    if (!enabled || !sessionCode) return;

    const baseUrl = wsUrl || import.meta.env.VITE_WS_URL || (
      typeof window !== 'undefined' && window.location.protocol === 'https:'
        ? 'wss://localhost:8000'
        : 'ws://localhost:8000'
    );
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

        // Handle ping with pong
        if (data.type === 'ping') {
          ws.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        onMessageRef.current?.(data);
      } catch {
        // Invalid JSON — ignore
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

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    } else {
      messageQueue.current.push(data);
    }
  }, []);

  return { isConnected, send, connectionStatus };
}

export type { UseWebSocketOptions, UseWebSocketReturn };
