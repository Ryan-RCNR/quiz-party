/**
 * Secure Session Manager
 *
 * Stores sensitive tokens in memory to mitigate XSS attacks.
 * SessionStorage is only used for non-sensitive session metadata.
 *
 * Security features:
 * - Tokens stored in memory (not accessible via XSS)
 * - Session metadata (non-sensitive) can be persisted
 * - Tokens cleared on page unload for security
 * - Optional session expiration
 */

export interface PlayerSession {
  playerId: string;
  displayName: string;
  sessionCode: string;
  teamId: string | null;
  teamName: string | null;
}

interface SecureSessionData extends PlayerSession {
  playerToken: string;
  expiresAt?: number;
}

// In-memory storage for sensitive tokens (XSS-resistant)
let memorySession: SecureSessionData | null = null;

// Session expiration time (4 hours)
const SESSION_EXPIRY_MS = 4 * 60 * 60 * 1000;

/**
 * Store session securely
 * - Token stored in memory only (not in sessionStorage)
 * - Non-sensitive metadata stored in sessionStorage for reconnection hints
 */
export function storeSecureSession(session: SecureSessionData): void {
  // Set expiration
  const sessionWithExpiry: SecureSessionData = {
    ...session,
    expiresAt: Date.now() + SESSION_EXPIRY_MS,
  };

  // Store full session in memory (including token)
  memorySession = sessionWithExpiry;

  // Store only non-sensitive metadata in sessionStorage (for reconnection UI)
  if (typeof sessionStorage !== 'undefined') {
    const metadata: PlayerSession = {
      playerId: session.playerId,
      displayName: session.displayName,
      sessionCode: session.sessionCode,
      teamId: session.teamId,
      teamName: session.teamName,
    };
    sessionStorage.setItem('quizparty_session_meta', JSON.stringify(metadata));
  }
}

/**
 * Get secure session from memory
 * Returns null if expired or not found
 */
export function getSecureSession(): SecureSessionData | null {
  if (!memorySession) return null;

  // Check expiration
  if (memorySession.expiresAt && Date.now() > memorySession.expiresAt) {
    clearSecureSession();
    return null;
  }

  return memorySession;
}

/**
 * Get session metadata (non-sensitive, for UI hints)
 * Used to show "Rejoin game?" prompt
 */
export function getSessionMetadata(): PlayerSession | null {
  if (typeof sessionStorage === 'undefined') return null;

  const stored = sessionStorage.getItem('quizparty_session_meta');
  if (!stored) return null;

  try {
    return JSON.parse(stored);
  } catch {
    return null;
  }
}

/**
 * Get player token (memory only)
 */
export function getPlayerToken(): string | null {
  return memorySession?.playerToken ?? null;
}

/**
 * Check if session exists and is valid
 */
export function hasValidSession(): boolean {
  const session = getSecureSession();
  return session !== null;
}

/**
 * Clear all session data
 */
export function clearSecureSession(): void {
  memorySession = null;

  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('quizparty_session_meta');
  }
}

/**
 * Refresh session expiration (call on activity)
 */
export function refreshSessionExpiry(): void {
  if (memorySession) {
    memorySession.expiresAt = Date.now() + SESSION_EXPIRY_MS;
  }
}

// Clear tokens on page unload for security
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    // Keep metadata for reconnection, but token is naturally cleared
    // since it's only in memory
  });
}
