import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { useLector } from '@/hooks/useLector';
import { Badge } from '@/components/Badge';
import type { LectorUpdateRequest } from '@/types';

export function MiPerfilPage() {
  const toast                         = useToast();
  const { lector, loading, recargar } = useLector();
  const [form,   setForm]             = useState<LectorUpdateRequest>({});
  const [saving, setSaving]           = useState(false);

  useEffect(() => {
    if (lector) {
      setForm({
        telefono:  lector.telefono  ?? '',
        direccion: lector.direccion ?? '',
        email:     lector.email     ?? '',
      });
    }
  }, [lector]);

  async function guardar() {
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

  if (loading) return <div className="text-center py-10 text-muted">Cargando...</div>;
  if (!lector) return <div className="text-center py-16 text-muted">No se encontro informacion</div>;

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-3xl font-bold">Mi perfil</h2>
        <p className="text-muted text-sm mt-1">Informacion de tu cuenta de lector</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <div className="text-base font-semibold mb-4">Informacion personal</div>
          <div className="flex flex-col gap-3">
            {([
              ['Nombre completo',     `${lector.nombre} ${lector.apellido}`],
              ['Numero de documento', lector.documento],
              ['Numero de carnet',    lector.numeroCarnet],
              ['Fecha de nacimiento', lector.fechaNacimiento ?? '—'],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <div className="text-xs text-muted">{label}</div>
                <div className="font-medium">{value}</div>
              </div>
            ))}
            <div>
              <div className="text-xs text-muted">Estado</div>
              <Badge value={lector.estado} />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="text-base font-semibold mb-4">Actualizar datos de contacto</div>
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label>Correo electronico</label>
              <input
                type="email"
                value={form.email ?? ''}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Telefono</label>
              <input
                type="text"
                value={form.telefono ?? ''}
                onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Direccion</label>
              <input
                type="text"
                value={form.direccion ?? ''}
                onChange={e => setForm(p => ({ ...p, direccion: e.target.value }))}
              />
            </div>
            <button className="btn btn-primary" disabled={saving} onClick={guardar}>
              {saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}