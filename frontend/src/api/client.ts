export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('access_token');
  
  // Use /api/auth for auth routes, /api/v1 for everything else
  const baseUrl = path.startsWith('/auth')
    ? 'http://localhost:4000/api'
    : 'http://localhost:4000/api/v1';
  
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const detail =
      payload.message ||
      payload.reason ||
      (Array.isArray(payload.guardFailures) && payload.guardFailures.length > 0
        ? `Guard failed: ${payload.guardFailures.join(', ')}`
        : null) ||
      payload.error;
    throw new Error(detail || `API error (${response.status})`);
  }

  return response.json() as Promise<T>;
}
