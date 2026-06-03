export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem('access_token');
  
  // Build URL:
  // - If caller provided a path starting with /auth or /v1, attach to /api directly
  // - Otherwise attach to /api/v1
  const apiHost = 'http://localhost:4000';
  let finalUrl: string;
  if (path.startsWith('/auth') || path.startsWith('/v1')) {
    finalUrl = `${apiHost}/api${path}`;
  } else {
    finalUrl = `${apiHost}/api/v1${path}`;
  }

  const response = await fetch(finalUrl, {
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
