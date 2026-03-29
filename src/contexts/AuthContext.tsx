// Contexto de autenticacion global.
// Provee el usuario actual, funciones de login y logout a toda la app.

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, decodeJwt } from '@/api/client';
import type { AuthUser, AuthResponse, Rol } from '@/types';

interface AuthCtxValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtxValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser]       = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Al montar, recupera el token guardado y valida que no haya expirado
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const decoded = decodeJwt(token);
      const exp = decoded.exp as number | undefined;
      if (exp && exp * 1000 > Date.now()) {
        setUser(buildUser(decoded));
      } else {
        localStorage.removeItem('token');
      }
    }
    setLoading(false);
  }, []);

  // Llama al endpoint de login, guarda los tokens y actualiza el estado
  async function login(email: string, password: string): Promise<void> {
    const res = await api.post<AuthResponse>('/v1/auth/login', { email, password });
    localStorage.setItem('token', res.accessToken);
    if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
    setUser(buildUser(decodeJwt(res.accessToken)));
  }

  // Limpia tokens y estado del usuario
  function logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// Hook que expone el contexto con validacion
export function useAuth(): AuthCtxValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}

function buildUser(decoded: Record<string, unknown>): AuthUser {
  return {
    email:        decoded.sub as string,
    rol:          (decoded.rol ?? decoded.role) as Rol,
    userId:       decoded.userId as number | undefined,
    lectorId:     decoded.lectorId as number | undefined,
    nombre:       decoded.nombre as string | undefined,
    numeroCarnet: decoded.numeroCarnet as string | undefined,
  };
}