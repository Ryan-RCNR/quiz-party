/**
 * Quiz Party API Client
 *
 * Shared API client for backend communication
 */

import type {
  SessionConfig,
  SessionCreateResponse,
  QuestionBank,
  QuestionBankWithQuestions,
  PlayerSession,
} from '../types';

// Get API URL - apps will provide this via env
const getApiUrl = () =>
  import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Default request timeout in milliseconds
const DEFAULT_TIMEOUT_MS = 10000;

// Generic fetch wrapper
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit & { timeout?: number } = {}
): Promise<T> {
  const url = `${getApiUrl()}${endpoint}`;
  const { timeout = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((fetchOptions.headers as Record<string, string>) || {}),
  };

  // Add auth token if available (teacher routes via Clerk)
  if (typeof window !== 'undefined' && window.Clerk?.session) {
    try {
      const token = await window.Clerk.session.getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch {
      // Silent fail — unauthenticated request
    }
  }

  // Set up timeout with AbortController
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      // Try to parse JSON error, fallback to text, then generic message
      const error = await response.json().catch(async () => {
        const text = await response.text().catch(() => '');
        return { detail: text || `Request failed with HTTP ${response.status}` };
      });
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout}ms`);
    }
    throw error;
  }
}

// ========================================
// Session API (Teacher)
// ========================================

export const sessionAPI = {
  // List sessions
  list: async (): Promise<SessionConfig[]> => {
    const data = await apiFetch<{ sessions?: SessionConfig[] } | SessionConfig[]>('/api/quizparty/sessions');
    return Array.isArray(data) ? data : data.sessions || [];
  },

  // Create session
  create: async (params: {
    name: string;
    question_bank_id: string;
    preset: string;
    chaos_level: string;
    team_count: number;
  }): Promise<SessionCreateResponse> => {
    return apiFetch('/api/quizparty/sessions', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Get session by code
  getByCode: async (code: string): Promise<SessionConfig> => {
    return apiFetch(`/api/quizparty/sessions/${code}`);
  },

  // Start session
  start: async (code: string): Promise<void> => {
    await apiFetch(`/api/quizparty/sessions/${code}/start`, { method: 'POST' });
  },

  // End session
  end: async (code: string): Promise<void> => {
    await apiFetch(`/api/quizparty/sessions/${code}/end`, { method: 'POST' });
  },
};

// ========================================
// Question Bank API (Teacher)
// ========================================

export const questionBankAPI = {
  // List question banks
  list: async (): Promise<QuestionBank[]> => {
    const data = await apiFetch<QuestionBank[] | { banks: QuestionBank[] }>('/api/quizparty/questions/banks');
    return Array.isArray(data) ? data : data.banks || [];
  },

  // Get bank with questions
  get: async (id: string): Promise<QuestionBankWithQuestions> => {
    return apiFetch(`/api/quizparty/questions/banks/${id}`);
  },

  // Create bank
  create: async (params: {
    name: string;
    description?: string;
    subject?: string;
    grade_level?: string;
  }): Promise<QuestionBank> => {
    return apiFetch('/api/quizparty/questions/banks', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  },

  // Add question to bank
  addQuestion: async (bankId: string, question: {
    question_text: string;
    options: string[];
    correct_index: number;
    category?: string;
    explanation?: string;
  }): Promise<void> => {
    await apiFetch(`/api/quizparty/questions/banks/${bankId}/questions`, {
      method: 'POST',
      body: JSON.stringify(question),
    });
  },
};

// ========================================
// Player API (Student)
// ========================================

export const playerAPI = {
  // Join session
  join: async (code: string, displayName: string): Promise<{
    player_id: string;
    player_token: string;
    display_name: string;
    session_code: string;
    team_id: string | null;
    team_name: string | null;
    status: string;
  }> => {
    return apiFetch(`/api/quizparty/sessions/${code}/join`, {
      method: 'POST',
      body: JSON.stringify({ display_name: displayName }),
    });
  },

  // Reconnect to session
  reconnect: async (code: string, playerToken: string): Promise<{
    team_id: string | null;
    team_name: string | null;
    status: string;
  }> => {
    return apiFetch(`/api/quizparty/sessions/${code}/reconnect`, {
      method: 'POST',
      body: JSON.stringify({ player_token: playerToken }),
    });
  },

  // Get stored session from sessionStorage
  getStoredSession: (): PlayerSession | null => {
    if (typeof sessionStorage === 'undefined') return null;
    const stored = sessionStorage.getItem('quizparty_session');
    if (!stored) return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  },

  // Store session in sessionStorage
  storeSession: (session: PlayerSession): void => {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.setItem('quizparty_session', JSON.stringify(session));
  },

  // Clear stored session
  clearSession: (): void => {
    if (typeof sessionStorage === 'undefined') return;
    sessionStorage.removeItem('quizparty_session');
  },
};
