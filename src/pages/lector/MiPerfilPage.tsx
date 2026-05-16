import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { useLector } from '@/hooks/useLector';
import { Badge } from '@/components/Badge';
import type { LectorUpdateRequest } from '@/types';

// Valida el formulario y retorna un objeto con los errores
function validar(form: LectorUpdateRequest): Record<string, string> {
  const errores: Record<string, string> = {};
  if (!form.email?.trim()) {
    errores.email = 'El correo es obligatorio';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errores.email = 'El correo no tiene un formato valido';
  }
  if (form.telefono && !/^\d{7,15}$/.test(form.telefono.replace(/\s/g, ''))) {
    errores.telefono = 'El telefono debe tener entre 7 y 15 digitos';
  }
  return errores;
}

export function MiPerfilPage() {
  const toast                         = useToast();
  const { lector, loading, recargar } = useLector();
  const [form,    setForm]            = useState<LectorUpdateRequest>({});
  const [original, setOriginal]       = useState<LectorUpdateRequest>({});
  const [errores,  setErrores]        = useState<Record<string, string>>({});
  const [saving,   setSaving]         = useState(false);

  useEffect(() => {
    if (lector) {
      const datos = {
        telefono:  lector.telefono  ?? '',
        direccion: lector.direccion ?? '',
        email:     lector.email     ?? '',
      };
      setForm(datos);
      setOriginal(datos);
    }
  }, [lector]);

  // Detecta si hubo algun cambio respecto a los datos originales
  const haycambios =
    form.email     !== original.email     ||
    form.telefono  !== original.telefono  ||
    form.direccion !== original.direccion;

  async function guardar() {
    const errs = validar(form);
    if (Object.keys(errs).length > 0) {
      setErrores(errs);
      return;
    }
    setErrores({});
    if (!lector) return;
    setSaving(true);
    try {
      await api.put(`/v1/lectores/${lector.id}`, form);
      toast('Perfil actualizado correctamente', 'success');
      recargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setSaving(false);
    }
  }

  const campo = (key: keyof LectorUpdateRequest) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm(p => ({ ...p, [key]: e.target.value }));
      setErrores(p => ({ ...p, [key]: '' }));
    };

  if (loading) return <div className="text-center py-10 text-muted">Cargando...</div>;
  if (!lector) return <div className="text-center py-16 text-muted">No se encontro informacion</div>;

  // Iniciales para el avatar
  const iniciales = `${lector.nombre?.[0] ?? ''}${lector.apellido?.[0] ?? ''}`.toUpperCase();

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-3xl font-bold">Mi perfil</h2>
        <p className="text-muted text-sm mt-1">Informacion de tu cuenta de lector</p>
      </div>

      {/* Avatar + nombre destacado */}
      <div className="flex items-center gap-4 mb-6">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center
                     text-xl font-bold text-white shrink-0"
          style={{ background: 'var(--color-accent, #f59e0b)' }}
        >
          {iniciales}
        </div>
        <div>
          <div className="text-xl font-bold">{lector.nombre} {lector.apellido}</div>
          <div className="text-sm text-muted">{lector.email}</div>
          <div className="mt-1"><Badge value={lector.estado} /></div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Informacion personal — solo lectura */}
        <div className="card">
          <div className="text-base font-semibold mb-4">Informacion personal</div>
          <div className="flex flex-col gap-3">
            {([
              ['Nombre completo',     `${lector.nombre} ${lector.apellido}`],
              ['Numero de documento', lector.documento       || '—'],
              ['Numero de carnet',    lector.numeroCarnet    || '—'],
              ['Fecha de nacimiento', lector.fechaNacimiento || '—'],
              ['Correo electronico',  lector.email           || '—'],
              ['Telefono',            lector.telefono        || '—'],
              ['Direccion',           lector.direccion       || '—'],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <div className="text-xs text-muted">{label}</div>
                <div className="font-medium">{value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Formulario de edicion */}
        <div className="card">
          <div className="text-base font-semibold mb-4">Actualizar datos de contacto</div>
          <div className="flex flex-col gap-4">

            <div className="form-group">
              <label>Correo electronico</label>
              <input
                type="email"
                value={form.email ?? ''}
                onChange={campo('email')}
                className={errores.email ? 'border-red-500' : ''}
              />
              {errores.email && (
                <span className="text-xs text-red-400 mt-1">{errores.email}</span>
              )}
            </div>

            <div className="form-group">
              <label>Telefono</label>
              <input
                type="text"
                value={form.telefono ?? ''}
                onChange={campo('telefono')}
                className={errores.telefono ? 'border-red-500' : ''}
              />
              {errores.telefono && (
                <span className="text-xs text-red-400 mt-1">{errores.telefono}</span>
              )}
            </div>

            <div className="form-group">
              <label>Direccion</label>
              <input
                type="text"
                value={form.direccion ?? ''}
                onChange={campo('direccion')}
              />
            </div>

            <button
              className="btn btn-primary"
              disabled={saving || !haycambios}
              onClick={guardar}
              style={{ opacity: (!haycambios && !saving) ? 0.5 : 1 }}
            >
              {saving ? 'Guardando...' : haycambios ? 'Guardar cambios' : 'Sin cambios'}
            </button>

          </div>
        </div>
      </div>
    </div>
  );
}
