import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import { Modal } from '@/components/Modal';
import type { LectorResponse, Page } from '@/types';

function estadoLector(l: LectorResponse): 'ACTIVO' | 'SUSPENDIDO' {
  return l.activo ? 'ACTIVO' : 'SUSPENDIDO';
}

export function GestionLectoresPage() {
  const toast = useToast();

  const [lectores,   setLectores]   = useState<LectorResponse[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [selected,   setSelected]   = useState<LectorResponse | null>(null);

  useEffect(() => { cargar(); }, [page]);

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

  async function toggleEstado(lector: LectorResponse, activar: boolean) {
    const accion = activar ? 'activar' : 'desactivar';
    try {
      await api.patch(`/v1/lectores/${lector.id}/${accion}`);
      toast(`Lector ${activar ? 'activado' : 'suspendido'} correctamente`, 'success');
      setLectores(prev => prev.map(l => l.id === lector.id ? { ...l, activo: activar } : l));
      if (selected?.id === lector.id) setSelected({ ...lector, activo: activar });
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

      <div className="flex gap-3 mb-5">
        <input
          className="flex-1"
          placeholder="Buscar por nombre o numero de carnet..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && cargar()}
        />
        <button className="btn btn-secondary" onClick={cargar}>Buscar</button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted">Cargando...</div>
      ) : lectores.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">--</p>
          <p>No se encontraron lectores</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>No. Carnet</th>
                  <th>Nombre completo</th>
                  <th>Correo</th>
                  <th>Telefono</th>
                  <th>Prestamos activos</th>
                  <th>Multas pendientes</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lectores.map(l => {
                  const estado = estadoLector(l);
                  return (
                    <tr key={l.id}>
                      <td className="font-mono text-sm">{l.numeroCarnet}</td>
                      <td className="font-medium">{l.nombre} {l.apellido}</td>
                      <td>{l.email}</td>
                      <td>{l.telefono ?? '—'}</td>
                      <td className="text-center">{l.prestamosActivos ?? 0}</td>
                      <td className="text-center">
                        {(l.multasPendientes ?? 0) > 0
                          ? <span className="font-bold text-red-400">{l.multasPendientes}</span>
                          : <span className="text-muted">0</span>
                        }
                      </td>
                      <td><Badge value={estado} /></td>
                      <td>
                        <div className="flex gap-1.5">
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => setSelected(l)}
                          >
                            Ver detalle
                          </button>
                          {estado === 'ACTIVO' ? (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => toggleEstado(l, false)}
                            >
                              Suspender
                            </button>
                          ) : (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => toggleEstado(l, true)}
                            >
                              Activar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      {selected && (() => {
        const estado = estadoLector(selected);
        return (
          <Modal
            title={`${selected.nombre} ${selected.apellido}`}
            onClose={() => setSelected(null)}
            actions={
              <div className="flex gap-2">
                {estado === 'ACTIVO' ? (
                  <button className="btn btn-danger" onClick={() => toggleEstado(selected, false)}>
                    Suspender lector
                  </button>
                ) : (
                  <button className="btn btn-success" onClick={() => toggleEstado(selected, true)}>
                    Activar lector
                  </button>
                )}
                <button className="btn btn-secondary" onClick={() => setSelected(null)}>
                  Cerrar
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-2 gap-4">
              {([
                ['No. Carnet',     selected.numeroCarnet],
                ['Correo',         selected.email],
                ['Telefono',       selected.telefono ?? '—'],
                ['Direccion',      selected.direccion ?? '—'],
                ['Nacimiento',     selected.fechaNacimiento ?? '—'],
                ['Max. prestamos', String(selected.maxPrestamos ?? 3)],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label}>
                  <div className="text-xs text-muted">{label}</div>
                  <div className="font-medium">{value}</div>
                </div>
              ))}
              <div>
                <div className="text-xs text-muted">Prestamos activos</div>
                <div className="font-medium">{selected.prestamosActivos ?? 0}</div>
              </div>
              <div>
                <div className="text-xs text-muted">Multas pendientes</div>
                <div className={`font-medium ${(selected.multasPendientes ?? 0) > 0 ? 'text-red-400' : ''}`}>
                  {selected.multasPendientes ?? 0}
                </div>
              </div>
              <div className="col-span-2">
                <div className="text-xs text-muted mb-1">Estado</div>
                <Badge value={estado} />
              </div>
            </div>
          </Modal>
        );
      })()}
    </div>
  );
}