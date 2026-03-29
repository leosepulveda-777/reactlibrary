// Pagina de gestion de reservas para bibliotecario y admin.
// Muestra la cola de espera de un libro y permite cancelar reservas manualmente.
// Cubre US-018.

import { useState } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/Badge';
import type { ReservaResponse } from '@/types';

export function GestionReservasPage() {
  const toast = useToast();

  const [libroId,  setLibroId]  = useState('');
  const [cola,     setCola]     = useState<ReservaResponse[]>([]);
  const [loading,  setLoading]  = useState(false);

  // Carga la cola de reservas para un libro especifico
  async function verCola() {
    if (!libroId) return;
    setLoading(true);
    try {
      const res = await api.get<ReservaResponse[]>(`/v1/reservas/libro/${libroId}/cola`);
      setCola(res);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Cancela una reserva desde el panel del bibliotecario
  async function cancelar(reservaId: number, lectorId: number) {
    if (!confirm('Cancelar esta reserva?')) return;
    try {
      await api.patch(`/v1/reservas/${reservaId}/cancelar?lectorId=${lectorId}`);
      toast('Reserva cancelada', 'success');
      verCola();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-3xl font-bold">Reservas</h2>
        <p className="text-muted text-sm mt-1">
          Cola de espera por libro. Ingresa el ID del libro para ver su cola.
        </p>
      </div>

      {/* Buscador por ID de libro */}
      <div className="flex gap-3 mb-5">
        <input
          style={{ width: 220 }}
          type="number"
          placeholder="ID del libro..."
          value={libroId}
          onChange={e => setLibroId(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && verCola()}
        />
        <button className="btn btn-primary" onClick={verCola}>
          Ver cola
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted">Cargando...</div>
      ) : cola.length > 0 ? (
        <div className="card">
          <div className="text-base font-semibold mb-4">
            Cola de reservas - Libro #{libroId}
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Posicion</th>
                  <th>ID Lector</th>
                  <th>Fecha reserva</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {cola.map(r => (
                  <tr key={r.id}>
                    <td>Posicion {r.posicionCola}</td>
                    <td>{r.lectorId}</td>
                    <td>{r.fechaReserva?.split('T')[0]}</td>
                    <td><Badge value={r.estado} /></td>
                    <td>
                      {r.estado === 'PENDIENTE' && (
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
        </div>
      ) : libroId ? (
        <div className="text-center py-16 text-muted">
          <p>No hay reservas para el libro #{libroId}</p>
        </div>
      ) : null}
    </div>
  );
}
