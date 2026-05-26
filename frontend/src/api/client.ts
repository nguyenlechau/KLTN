const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000/api';

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('access_token');
  const response = await fetch(`${API_BASE}${path}`, {
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
