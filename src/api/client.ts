// Cliente HTTP centralizado para comunicarse con el backend Spring Boot.
// Todas las peticiones pasan por aqui para agregar el JWT automaticamente.

const API_BASE = '/api'; // Vite hace proxy de /api hacia http://localhost:8080

// Funcion interna que ejecuta el fetch, adjunta el token y lanza error si el status no es 2xx
async function request<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');

  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers as Record<string, string> ?? {}),
    },
    ...opts,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message ?? data.error ?? `Error ${res.status}`);
  }

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
