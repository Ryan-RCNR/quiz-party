/**
 * useFetchData Hook
 *
 * Reusable data fetching hook with loading, error, and refetch support
 */

import { useState, useEffect, useCallback, useRef } from 'react';

export interface UseFetchDataResult<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseFetchDataOptions {
  /** Whether to fetch data immediately on mount (default: true) */
  immediate?: boolean;
  /** Polling interval in milliseconds (if set, will refetch on interval) */
  pollInterval?: number;
}

/**
 * Hook for fetching data with loading, error, and refetch support
 *
 * @example
 * const { data, loading, error, refetch } = useFetchData(
 *   () => sessionAPI.list(),
 *   { immediate: true }
 * );
 */
export function useFetchData<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchDataOptions = {}
): UseFetchDataResult<T> {
  const { immediate = true, pollInterval } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  // Store fetchFn in ref to avoid dependency issues
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const refetch = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await fetchFnRef.current();
      setData(result);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    if (immediate) {
      refetch();
    }
  }, [immediate, refetch]);

  // Polling
  useEffect(() => {
    if (!pollInterval) return;

    const interval = setInterval(refetch, pollInterval);
    return () => clearInterval(interval);
  }, [pollInterval, refetch]);

  return { data, loading, error, refetch };
}
