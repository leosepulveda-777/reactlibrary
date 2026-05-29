// Cliente HTTP centralizado para comunicarse con el backend Spring Boot.
// Todas las peticiones pasan por aqui para agregar el JWT automaticamente.

const API_BASE = '/api'; // Vite hace proxy de /api hacia http://localhost:8080

let refreshing: Promise<string | null> | null = null;

async function tryRefresh(): Promise<string | null> {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${API_BASE}/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) throw new Error('refresh failed');
    const data = await res.json();
    const newToken = data?.data?.accessToken ?? data?.accessToken;
    if (newToken) {
      localStorage.setItem('token', newToken);
      return newToken;
    }
  } catch {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  }
  return null;
}

// Funcion interna que ejecuta el fetch, adjunta el token y lanza error si el status no es 2xx
async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  let token = localStorage.getItem('token');

  // Si el token existe, verificar si ya expiró antes de hacer el request
  if (token) {
    const { exp } = decodeJwt(token) as { exp?: number };
    if (exp && exp * 1000 < Date.now() + 10_000) {
      // Expira en menos de 10 segundos o ya expiró → refrescar
      if (!refreshing) refreshing = tryRefresh().finally(() => { refreshing = null; });
      token = await refreshing;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers as Record<string, string> ?? {}),
    },
    ...opts,
  });

  // Si da 401, intentar refresh una vez y reintentar
  if (res.status === 401) {
    if (!refreshing) refreshing = tryRefresh().finally(() => { refreshing = null; });
    const newToken = await refreshing;
    if (newToken) {
      const retry = await fetch(`${API_BASE}${path}`, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${newToken}`,
          ...(opts.headers as Record<string, string> ?? {}),
        },
        ...opts,
      });
      const retryData = await retry.json().catch(() => ({}));
      if (!retry.ok) throw new Error(retryData.message ?? retryData.error ?? `Error ${retry.status}`);
      return (retryData.data !== undefined ? retryData.data : retryData) as T;
    }
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message ?? data.error ?? `Error ${res.status}`);

  // El backend devuelve { data: ... } o el objeto directamente segun el endpoint
  return (data.data !== undefined ? data.data : data) as T;
}

// Metodos tipados por verbo HTTP
export const api = {
  get:    <T>(path: string)                 => request<T>(path),
  post:   <T>(path: string, body: unknown)  => request<T>(path, { method: 'POST',   body: JSON.stringify(body) }),
  put:    <T>(path: string, body: unknown)  => request<T>(path, { method: 'PUT',    body: JSON.stringify(body) }),
  patch:  <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH',  body: body ? JSON.stringify(body) : undefined }),
  delete: <T>(path: string)                 => request<T>(path, { method: 'DELETE' }),
};

// Decodifica el payload del JWT sin libreria externa
export function decodeJwt(token: string): Record<string, unknown> {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64)) as Record<string, unknown>;
  } catch {
    return {};
  }
}