/**
 * Message Handlers Utility
 *
 * Type-safe message dispatcher for WebSocket messages
 */

/**
 * Create a type-safe message dispatcher
 *
 * @example
 * const messageHandlers = {
 *   lobby_update: (msg: WSLobbyUpdate) => setPlayers(msg.players),
 *   player_connected: (msg: WSPlayerConnected) => addPlayer(msg),
 * };
 *
 * const dispatch = createMessageDispatcher(messageHandlers);
 * dispatch(data); // Automatically routes to correct handler
 */
export function createMessageDispatcher<
  THandlers extends Record<string, (msg: never) => void>
>(handlers: THandlers) {
  return (data: Record<string, unknown>) => {
    const msg = data as { type: string } & Record<string, unknown>;
    const handler = handlers[msg.type as keyof THandlers];

    if (handler) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (handler as (msg: any) => void)(msg);
      return true;
    }

    return false;
  };
}

/**
 * Type guard to check if a message has a specific type
 */
export function isMessageType<T extends { type: string }>(
  msg: unknown,
  type: T['type']
): msg is T {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    'type' in msg &&
    (msg as { type: string }).type === type
  );
}

/**
 * Safe property accessor for message data
 */
export function getMessageProperty<T>(
  msg: Record<string, unknown>,
  key: string,
  defaultValue: T
): T {
  const value = msg[key];
  return value !== undefined ? (value as T) : defaultValue;
}
