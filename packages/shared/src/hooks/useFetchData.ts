/**
 * useFetchData Hook
 *
 * Reusable data fetching hook with loading, error, refetch support, and request deduplication
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
  /** Cache key for request deduplication (if set, concurrent requests with same key are deduplicated) */
  cacheKey?: string;
  /** Cache TTL in milliseconds (default: 0, no caching) */
  cacheTTL?: number;
}

// In-flight request cache for deduplication
const inFlightRequests = new Map<string, Promise<unknown>>();

// Result cache for TTL-based caching
const resultCache = new Map<string, { data: unknown; timestamp: number }>();

/**
 * Hook for fetching data with loading, error, and refetch support
 *
 * @example
 * const { data, loading, error, refetch } = useFetchData(
 *   () => sessionAPI.list(),
 *   { immediate: true, cacheKey: 'sessions', cacheTTL: 5000 }
 * );
 */
export function useFetchData<T>(
  fetchFn: () => Promise<T>,
  options: UseFetchDataOptions = {}
): UseFetchDataResult<T> {
  const { immediate = true, pollInterval, cacheKey, cacheTTL = 0 } = options;

  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(immediate);
  const [error, setError] = useState<string | null>(null);

  // Store fetchFn in ref to avoid dependency issues
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const refetch = useCallback(async () => {
    // Check cache if TTL is set
    if (cacheKey && cacheTTL > 0) {
      const cached = resultCache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTTL) {
        setData(cached.data as T);
        setLoading(false);
        return;
      }
    }

    // Check for in-flight request
    if (cacheKey && inFlightRequests.has(cacheKey)) {
      try {
        const result = await inFlightRequests.get(cacheKey);
        setData(result as T);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'An error occurred';
        setError(message);
      } finally {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    const fetchPromise = fetchFnRef.current();

    // Store in-flight request
    if (cacheKey) {
      inFlightRequests.set(cacheKey, fetchPromise);
    }

    try {
      const result = await fetchPromise;
      setData(result);

      // Cache result if TTL is set
      if (cacheKey && cacheTTL > 0) {
        resultCache.set(cacheKey, { data: result, timestamp: Date.now() });
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      console.error('Fetch error:', err);
    } finally {
      // Remove from in-flight requests
      if (cacheKey) {
        inFlightRequests.delete(cacheKey);
      }
      setLoading(false);
    }
  }, [cacheKey, cacheTTL]);

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

/**
 * Clear all cached data
 */
export function clearFetchCache(): void {
  resultCache.clear();
}

/**
 * Clear specific cache entry
 */
export function clearCacheKey(key: string): void {
  resultCache.delete(key);
}
