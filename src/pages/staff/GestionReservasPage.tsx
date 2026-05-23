import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import type { ReservaResponse, Page } from '@/types';

export function GestionReservasPage() {
  const toast = useToast();

  const [reservas,     setReservas]     = useState<ReservaResponse[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(0);
  const [totalPages,   setTotalPages]   = useState(0);
  const [filtroEstado, setFiltroEstado] = useState('');

  useEffect(() => { cargar(); }, [page, filtroEstado]);

  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '15' });
      if (filtroEstado) params.set('estado', filtroEstado);
      const res = await api.get<Page<ReservaResponse>>(`/v1/reservas?${params}`);
      setReservas(res.content ?? []);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function cancelar(reservaId: number, lectorId: number) {
    if (!confirm('Cancelar esta reserva?')) return;
    try {
      await api.patch(`/v1/reservas/${reservaId}/cancelar?lectorId=${lectorId}`);
      toast('Reserva cancelada', 'success');
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-3xl font-bold">Reservas</h2>
        <p className="text-muted text-sm mt-1">Gestion de la cola de espera de libros</p>
      </div>

      <div className="flex gap-3 mb-5">
        <select
          style={{ width: 220 }}
          value={filtroEstado}
          onChange={e => { setFiltroEstado(e.target.value); setPage(0); }}
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="LISTA">Lista</option>
          <option value="COMPLETADA">Completada</option>
          <option value="CANCELADA">Cancelada</option>
          <option value="EXPIRADA">Expirada</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted">Cargando...</div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">--</p>
          <p>No hay reservas{filtroEstado ? ` con estado ${filtroEstado}` : ''}</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Libro</th>
                  <th>Lector</th>
                  <th>Cola</th>
                  <th>Fecha reserva</th>
                  <th>Expira</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.tituloLibro ?? '—'}</td>
                    <td>
                      <div className="font-medium">{r.nombreLector ?? `Lector #${r.lectorId}`}</div>
                      {r.numeroCarnet && (
                        <div className="text-xs text-muted font-mono">{r.numeroCarnet}</div>
                      )}
                    </td>
                    <td className="text-center">{r.posicionCola ?? '—'}</td>
                    <td>{r.fechaReserva?.split('T')[0]}</td>
                    <td>
                      {r.fechaExpiracion && (
                        <span className="text-xs text-muted">{r.fechaExpiracion.split('T')[0]}</span>
                      )}
                    </td>
                    <td><Badge value={r.estado} /></td>
                    <td>
                      {(r.estado === 'PENDIENTE' || r.estado === 'LISTA') && (
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => cancelar(r.id, r.lectorId)}
                        >
                          Cancelar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}