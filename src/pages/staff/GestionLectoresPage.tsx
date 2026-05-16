// Pagina de gestion de lectores para bibliotecario y admin.
// Permite buscar, ver detalle, activar y suspender lectores.
// Cubre US-023.

import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import { Modal } from '@/components/Modal';
import type { LectorResponse, Page } from '@/types';

export function GestionLectoresPage() {
  const toast = useToast();

  const [lectores,    setLectores]    = useState<LectorResponse[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(0);
  const [totalPages,  setTotalPages]  = useState(0);
  const [selected,    setSelected]    = useState<LectorResponse | null>(null);

  useEffect(() => { cargar(); }, [page]);

  // Busca lectores por nombre, documento o carnet
  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '15' });
      if (search) params.set('search', search);
      const res = await api.get<Page<LectorResponse>>(`/v1/lectores?${params}`);
      setLectores(res.content ?? []);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Activa o suspende un lector segun el parametro
  async function toggleEstado(id: number, activar: boolean) {
    const accion = activar ? 'activar' : 'desactivar';
    try {
      await api.patch(`/v1/lectores/${id}/${accion}`);
      toast(`Lector ${activar ? 'activado' : 'suspendido'} correctamente`, 'success');
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-3xl font-bold">Lectores</h2>
        <p className="text-muted text-sm mt-1">Gestion de usuarios registrados como lectores</p>
      </div>

      {/* Barra de busqueda */}
      <div className="flex gap-3 mb-5">
        <input
          className="flex-1"
          placeholder="Buscar por nombre, documento o numero de carnet..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && cargar()}
        />
        <button className="btn btn-secondary" onClick={cargar}>Buscar</button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted">Cargando...</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No. Carnet</th>
                  <th>Nombre completo</th>
                  <th>Documento</th>
                  <th>Correo</th>
                  <th>Telefono</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lectores.map(l => (
                  <tr key={l.id}>
                    <td className="font-mono text-sm">{l.numeroCarnet}</td>
                    <td className="font-medium">{l.nombre} {l.apellido}</td>
                    <td>{l.documento}</td>
                    <td>{l.email}</td>
                    <td>{l.telefono ?? '—'}</td>
                    <td><Badge value={l.estado} /></td>
                    <td>
                      <div className="flex gap-1.5">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => setSelected(l)}
                        >
                          Ver detalle
                        </button>
                        {l.estado === 'ACTIVO' ? (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => toggleEstado(l.id, false)}
                          >
                            Suspender
                          </button>
                        ) : (
                          <button
                            className="btn btn-sm btn-success"
                            onClick={() => toggleEstado(l.id, true)}
                          >
                            Activar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      {/* Modal de detalle del lector */}
      {selected && (
        <Modal
          title={`${selected.nombre} ${selected.apellido}`}
          onClose={() => setSelected(null)}
          actions={
            <button className="btn btn-secondary" onClick={() => setSelected(null)}>
              Cerrar
            </button>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            {([
              ['No. Carnet',   selected.numeroCarnet],
              ['Documento',    selected.documento],
              ['Correo',       selected.email],
              ['Telefono',     selected.telefono ?? '—'],
              ['Direccion',    selected.direccion ?? '—'],
              ['Nacimiento',   selected.fechaNacimiento ?? '—'],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <div className="text-xs text-muted">{label}</div>
                <div className="font-medium">{value}</div>
              </div>
            ))}
            <div>
              <div className="text-xs text-muted">Estado</div>
              <Badge value={selected.estado} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
