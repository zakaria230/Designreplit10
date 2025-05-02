import { QueryClient, QueryFunction } from "@tanstack/react-query";

// API Base URL - use environment variable in production, fallback to relative path in development
export const API_BASE_URL = import.meta.env.VITE_API_URL || '';

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// CSRF token storage
let csrfTokenCache: string | undefined;

// Function to get CSRF token
async function getCsrfToken(): Promise<string | undefined> {
  // Return cached token if available
  if (csrfTokenCache) {
    return csrfTokenCache;
  }
  
  // Try to get from cookies first
  const value = `; ${document.cookie}`;
  const parts = value.split(`; XSRF-TOKEN=`);
  if (parts.length === 2) {
    const csrfToken = parts.pop()?.split(';').shift();
    if (csrfToken) {
      csrfTokenCache = csrfToken;
      return csrfToken;
    }
  }
  
  // If not in cookies, fetch from API
  try {
    const response = await fetch(`${API_BASE_URL}/api/csrf-token`);
    if (response.ok) {
      const data = await response.json();
      if (data.csrfToken) {
        csrfTokenCache = data.csrfToken;
        return data.csrfToken;
      }
    }
  } catch (error) {
    console.error('Failed to fetch CSRF token:', error);
  }
  
  return undefined;
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get CSRF token if method is not GET/HEAD (state changing operations)
  let headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add CSRF token to all state-changing requests (non-GET, non-HEAD)
  if (method !== 'GET' && method !== 'HEAD') {
    const csrfToken = await getCsrfToken();
    if (csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
  }
  
  // Add additional security headers
  headers['X-Requested-With'] = 'XMLHttpRequest';
  
  // Add API base URL if URL starts with /api
  const fullUrl = url.startsWith('/api') ? `${API_BASE_URL}${url}` : url;
  
  const res = await fetch(fullUrl, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get base URL and params
    const baseUrl = queryKey[0] as string;
    const params = queryKey[1] as Record<string, any> | undefined;
    
    // Create URL with query parameters if they exist
    let url = baseUrl;
    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      
      const queryString = searchParams.toString();
      if (queryString) {
        url = `${baseUrl}?${queryString}`;
      }
    }
    
    // Add API base URL if URL starts with /api
    if (url.startsWith('/api')) {
      url = `${API_BASE_URL}${url}`;
    }
    
    // Add headers for security
    const headers: Record<string, string> = {
      'X-Requested-With': 'XMLHttpRequest'
    };
    
    const res = await fetch(url, {
      credentials: "include",
      headers
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
