const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export class ApiError extends Error {
  public code: string;
  public details?: any;
  public status: number;

  constructor(message: string, status: number, code: string, details?: any) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

interface CacheEntry {
  data: any;
  expiry: number;
}

// In-memory client cache map
const apiCache = new Map<string, CacheEntry>();

/**
 * Configure default cache TTLs (in milliseconds) per endpoint prefix.
 */
const CACHE_TTL_MAP: Record<string, number> = {
  '/bootcamps': 5 * 60 * 1000, // 5 minutes
  '/employees': 2 * 60 * 1000, // 2 minutes
  '/stats': 30 * 1000, // 30 seconds
  '/allotments': 15 * 1000, // 15 seconds
  '/allotments/records': 30 * 1000, // 30 seconds
  '/notifications': 20 * 1000, // 20 seconds
};

/**
 * Clear specific cached items or the entire cache.
 * Called automatically after any mutation (POST, PATCH, PUT, DELETE).
 */
export function clearApiCache(endpointPrefix?: string): void {
  if (!endpointPrefix) {
    apiCache.clear();
    return;
  }
  for (const key of apiCache.keys()) {
    if (key.startsWith(endpointPrefix)) {
      apiCache.delete(key);
    }
  }
}

export interface ApiRequestOptions extends RequestInit {
  skipCache?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: ApiRequestOptions = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isGet = method === 'GET';

  // Check cache for GET requests unless explicitly skipped
  if (isGet && !options.skipCache) {
    const cached = apiCache.get(endpoint);
    if (cached && cached.expiry > Date.now()) {
      return cached.data as T;
    }
  }

  const token = localStorage.getItem('alhaditha_token');
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    (headers as any)['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const resJson = await response.json().catch(() => null);

  if (!response.ok) {
    const errorInfo = resJson?.error || {};
    throw new ApiError(
      errorInfo.message || 'An unexpected error occurred',
      response.status,
      errorInfo.code || 'UNKNOWN_ERROR',
      errorInfo.details
    );
  }

  const responseData = resJson.data as T;

  // On successful mutations, invalidate relevant caches automatically
  if (!isGet) {
    if (endpoint.startsWith('/allotments')) {
      clearApiCache('/allotments');
      clearApiCache('/stats');
      clearApiCache('/bootcamps');
      clearApiCache('/employees');
      clearApiCache('/notifications');
    } else if (endpoint.startsWith('/employees')) {
      clearApiCache('/employees');
      clearApiCache('/stats');
    } else if (endpoint.startsWith('/bootcamps')) {
      clearApiCache('/bootcamps');
      clearApiCache('/stats');
    } else {
      clearApiCache();
    }
  } else {
    // Store in cache if endpoint matches a cacheable pattern
    const matchedPrefix = Object.keys(CACHE_TTL_MAP).find((p) => endpoint.startsWith(p));
    if (matchedPrefix) {
      const ttl = CACHE_TTL_MAP[matchedPrefix];
      apiCache.set(endpoint, {
        data: responseData,
        expiry: Date.now() + ttl,
      });
    }
  }

  return responseData;
}


