/**
 * Clerk global type definitions
 *
 * Provides type safety for accessing the Clerk global object
 * without using @ts-expect-error
 */

interface ClerkSession {
  getToken(): Promise<string | null>;
}

interface ClerkClient {
  session?: ClerkSession;
}

declare global {
  interface Window {
    Clerk?: ClerkClient;
  }
}

export {};
