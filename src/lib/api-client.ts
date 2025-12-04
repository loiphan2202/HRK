/**
 * Helper function to make authenticated API requests
 * Automatically includes JWT token from localStorage
 */
export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = globalThis.window === undefined ? null : localStorage.getItem('token');

  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  // Only add Content-Type for JSON, not for FormData
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add Authorization header if token exists
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

/**
 * Helper for authenticated POST requests
 * Supports both JSON and FormData
 */
export async function apiPost(url: string, data: Record<string, unknown> | FormData): Promise<Response> {
  const body = data instanceof FormData ? data : JSON.stringify(data);
  return apiRequest(url, {
    method: 'POST',
    body,
  });
}

/**
 * Helper for authenticated PUT requests
 * Supports both JSON and FormData
 */
export async function apiPut(url: string, data: Record<string, unknown> | FormData): Promise<Response> {
  const body = data instanceof FormData ? data : JSON.stringify(data);
  return apiRequest(url, {
    method: 'PUT',
    body,
  });
}

/**
 * Helper for authenticated DELETE requests
 */
export async function apiDelete(url: string): Promise<Response> {
  return apiRequest(url, {
    method: 'DELETE',
  });
}

/**
 * Helper for authenticated GET requests
 */
export async function apiGet(url: string): Promise<Response> {
  return apiRequest(url, {
    method: 'GET',
  });
}

