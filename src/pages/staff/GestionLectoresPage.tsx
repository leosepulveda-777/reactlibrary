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

// Iniciales del nombre para el avatar
function iniciales(l: LectorResponse) {
  return `${l.nombre?.[0] ?? ''}${l.apellido?.[0] ?? ''}`.toUpperCase();
}

export function GestionLectoresPage() {
  const toast = useToast();

  const [lectores,   setLectores]   = useState<LectorResponse[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElem,  setTotalElem]  = useState(0);
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
      setTotalElem(res.totalElements ?? 0);
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
      setLectores(prev => prev.map(l =>
        l.id === lector.id ? { ...l, activo: activar, estado: activar ? 'ACTIVO' : 'SUSPENDIDO' } : l
      ));
      if (selected?.id === lector.id) setSelected({ ...lector, activo: activar });
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <div>
      {/* Encabezado con contador */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-3xl font-bold">Lectores</h2>
          <p className="text-muted text-sm mt-1">
            {!loading && `${totalElem} lectores registrados`}
          </p>
        </div>
      </div>

      {/* Barra de búsqueda */}
      <div className="flex gap-3 mb-5">
        <input
          className="flex-1"
          placeholder="Buscar por nombre o número de carnet..."
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
                  <th>Lector</th>
                  <th>Carnet</th>
                  <th>Contacto</th>
                  <th className="text-center">Préstamos activos</th>
                  <th className="text-center">Multas pendientes</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {lectores.map(l => {
                  const estado = estadoLector(l);
                  return (
                    <tr key={l.id}>
                      {/* Avatar + nombre */}
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                            style={{
                              background: l.activo
                                ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                                : '#374151',
                            }}
                          >
                            {iniciales(l)}
                          </div>
                          <div>
                            <div className="font-medium leading-tight">
                              {l.nombre} {l.apellido}
                            </div>
                            <div className="text-xs text-muted">{l.email}</div>
                          </div>
                        </div>
                      </td>
                      {/*  No mostrar ID numérico, solo el carnet legible */}
                      <td className="font-mono text-sm">{l.numeroCarnet}</td>
                      <td className="text-sm">{l.telefono ?? '—'}</td>
                      <td className="text-center">
                        <span className={l.prestamosActivos ? 'font-semibold text-blue-400' : 'text-muted'}>
                          {l.prestamosActivos ?? 0}
                        </span>
                      </td>
                      <td className="text-center">
                        {(l.multasPendientes ?? 0) > 0 ? (
                          <span className="font-bold text-red-400">{l.multasPendientes}</span>
                        ) : (
                          <span className="text-muted">0</span>
                        )}
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

      {/* Modal de detalle — diseño mejorado con más espacio aprovechado */}
      {selected && (() => {
        const estado = estadoLector(selected);
        return (
          <Modal
            title="Detalle del lector"
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
            {/* Avatar y nombre */}
            <div className="flex items-center gap-4 mb-5 pb-5 border-b border-border">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0"
                style={{
                  background: selected.activo
                    ? 'linear-gradient(135deg,#f59e0b,#d97706)'
                    : '#374151',
                }}
              >
                {iniciales(selected)}
              </div>
              <div>
                <div className="text-lg font-bold">{selected.nombre} {selected.apellido}</div>
                <div className="text-sm text-muted">{selected.email}</div>
                <div className="mt-1.5"><Badge value={estado} /></div>
              </div>
            </div>

            {/* Cuadrícula 3 columnas — aprovecha todo el ancho */}
            <div className="grid grid-cols-3 gap-4">
              {([
                ['No. Carnet',      selected.numeroCarnet    || '—'],
                ['Teléfono',        selected.telefono        || '—'],
                ['Nacimiento',      selected.fechaNacimiento ? String(selected.fechaNacimiento) : '—'],
                ['Dirección',       selected.direccion       || '—'],
                ['Máx. préstamos',  String(selected.maxPrestamos ?? 3)],
                ['Préstamos activos', String(selected.prestamosActivos ?? 0)],
              ] as [string, string][]).map(([label, value]) => (
                <div key={label}>
                  <div className="text-xs text-muted mb-0.5">{label}</div>
                  <div className="font-medium text-sm">{value}</div>
                </div>
              ))}
            </div>

            {/* Multas pendientes destacadas */}
            {(selected.multasPendientes ?? 0) > 0 && (
              <div className="mt-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                Este lector tiene <strong>{selected.multasPendientes}</strong> multa{selected.multasPendientes !== 1 ? 's' : ''} pendiente{selected.multasPendientes !== 1 ? 's' : ''}.
              </div>
            )}
          </Modal>
        );
      })()}
    </div>
  );
}
