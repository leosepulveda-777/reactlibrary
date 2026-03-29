// Pagina de inicio de sesion.
// Llama a POST /api/v1/auth/login y guarda el JWT en localStorage.

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface LoginPageProps {
  onSwitch: () => void; // Cambia a la vista de registro
}

export function LoginPage({ onSwitch }: LoginPageProps) {
  const { login } = useAuth();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="w-full max-w-md bg-surface border border-border rounded-2xl p-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl text-accent">BiblioSystem</h1>
          <p className="text-muted text-sm mt-2">Sistema de Gestion de Biblioteca</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="flex flex-col gap-4">
          <div className="form-group">
            <label>Correo electronico</label>
            <input
              type="email"
              placeholder="correo@ejemplo.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <div className="form-group">
            <label>Contrasena</label>
            <input
              type="password"
              placeholder="********"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            />
          </div>

          <button
            className="btn btn-primary w-full justify-center mt-2"
            disabled={loading}
            onClick={handleSubmit}
          >
            {loading ? 'Ingresando...' : 'Iniciar sesion'}
          </button>
        </div>

        <div className="border-t border-border mt-6 pt-6 text-center text-sm text-muted">
          No tienes cuenta?{' '}
          <span
            className="text-accent cursor-pointer hover:underline font-medium"
            onClick={onSwitch}
          >
            Registrate aqui
          </span>
        </div>
      </div>
    </div>
  );
}
