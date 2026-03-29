import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { useLector } from '@/hooks/useLector';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import { Modal } from '@/components/Modal';
import type { ReservaResponse, Page } from '@/types';

export function MisReservasPage() {
  const toast          = useToast();
  const { lector }     = useLector();

  const [reservas,   setReservas]   = useState<ReservaResponse[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal,  setShowModal]  = useState(false);
  const [libroId,    setLibroId]    = useState('');

  useEffect(() => { cargar(); }, [page, lector]);

  async function cargar() {
    if (!lector?.id) return;
    setLoading(true);
    try {
      const res = await api.get<Page<ReservaResponse>>(
        `/v1/reservas/lector/${lector.id}?page=${page}&size=10`
      );
      setReservas(res.content ?? []);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function cancelar(id: number) {
    if (!confirm('Cancelar esta reserva?')) return;
    try {
      await api.patch(`/v1/reservas/${id}/cancelar?lectorId=${lector!.id}`);
      toast('Reserva cancelada', 'success');
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function crearReserva() {
    if (!libroId) return;
    try {
      await api.post(`/v1/reservas/lector/${lector!.id}`, {
        libroId: parseInt(libroId),
      });
      toast('Reserva creada correctamente', 'success');
      setShowModal(false);
      setLibroId('');
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-3xl font-bold">Mis reservas</h2>
          <p className="text-muted text-sm mt-1">Cola de espera para libros no disponibles</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Nueva reserva
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted">Cargando...</div>
      ) : reservas.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">--</p>
          <p>No tienes reservas activas</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Libro</th>
                  <th>Fecha reserva</th>
                  <th>Posicion en cola</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.tituloLibro ?? '—'}</td>
                    <td>{r.fechaReserva?.split('T')[0]}</td>
                    <td>Posicion {r.posicionCola}</td>
                    <td><Badge value={r.estado} /></td>
                    <td>
                      {r.estado === 'PENDIENTE' && (
                        <button className="btn btn-sm btn-danger" onClick={() => cancelar(r.id)}>
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

      {showModal && (
        <Modal
          title="Nueva reserva"
          onClose={() => setShowModal(false)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              <button className="btn btn-primary" onClick={crearReserva}>Reservar</button>
            </>
          }
        >
          <div className="form-group">
            <label>ID del libro</label>
            <input
              type="number"
              placeholder="Ingresa el ID del libro"
              value={libroId}
              onChange={e => setLibroId(e.target.value)}
            />
            <span className="text-xs text-muted">Puedes encontrar el ID en el catalogo de libros</span>
          </div>
        </Modal>
      )}
    </div>
  );
}