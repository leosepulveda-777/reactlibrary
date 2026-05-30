import { useState } from 'react';
import { api } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import type { RegisterRequest } from '@/types';

interface RegisterPageProps {
  onSwitch: () => void;
}

const FIELDS: Array<[keyof RegisterRequest, string, string]> = [
  ['nombre',          'Nombre',              'text'],
  ['apellido',        'Apellido',            'text'],
  ['documento',       'Número de documento', 'text'],
  ['email',           'Correo electronico',  'email'],
  ['telefono',        'Telefono',            'text'],
  ['fechaNacimiento', 'Fecha de nacimiento', 'date'],
  ['password',        'Contrasena',          'password'],
];

export function RegisterPage({ onSwitch }: RegisterPageProps) {
  const { login } = useAuth();
  const toast     = useToast();

  const [form, setForm] = useState<RegisterRequest>({
    nombre: '', apellido: '', documento: '', email: '',
    telefono: '', direccion: '', fechaNacimiento: '', password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const handleChange = (key: keyof RegisterRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  async function handleSubmit() {
    setError('');
    setLoading(true);
    try {
      await api.post('/v1/auth/register', form);
      toast('Cuenta creada correctamente', 'success');
      await login(form.email, form.password);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg py-10">
      <div className="w-full max-w-xl bg-surface border border-border rounded-2xl p-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl text-accent">BiblioSystem</h1>
          <p className="text-muted text-sm mt-2">Crea tu cuenta de lector</p>
        </div>

        {error && <div className="alert alert-danger">{error}</div>}

        <div className="grid grid-cols-2 gap-4">
          {FIELDS.map(([key, label, type]) => (
            <div
              key={key}
              className={`form-group ${
                key === 'password' || key === 'documento' ? 'col-span-2' : ''
              }`}
            >
              <label>{label}</label>
              <input type={type} value={form[key]} onChange={handleChange(key)} />
            </div>
          ))}

          <div className="form-group col-span-2">
            <label>Direccion</label>
            <input
              type="text"
              value={form.direccion}
              onChange={handleChange('direccion')}
            />
          </div>
        </div>

        <button
          className="btn btn-primary w-full justify-center mt-6"
          disabled={loading}
          onClick={handleSubmit}
        >
          {loading ? 'Creando cuenta...' : 'Registrarme'}
        </button>

        <div className="border-t border-border mt-6 pt-6 text-center text-sm text-muted">
          Ya tienes cuenta?{' '}
          <span
            className="text-accent cursor-pointer hover:underline font-medium"
            onClick={onSwitch}
          >
            Iniciar sesion
          </span>
        </div>
      </div>
    </div>
  );
}