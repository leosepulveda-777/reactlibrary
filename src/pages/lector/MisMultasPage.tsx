import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { useLector } from '@/hooks/useLector';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import type { MultaResponse, Page } from '@/types';

export function MisMultasPage() {
  const toast          = useToast();
  const { lector }     = useLector();

  const [multas,     setMultas]     = useState<MultaResponse[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => { cargar(); }, [page, lector]);

  async function cargar() {
    if (!lector?.id) return;
    setLoading(true);
    try {
      const res = await api.get<Page<MultaResponse>>(
        `/v1/multas/lector/${lector.id}?page=${page}&size=10`
      );
      setMultas(res.content ?? []);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const totalPendiente = multas
    .filter(m => m.estado === 'PENDIENTE')
    .reduce((sum, m) => sum + (m.monto - m.montoPagado), 0);

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-3xl font-bold">Mis multas</h2>
        <p className="text-muted text-sm mt-1">Multas generadas por devolucion tardia</p>
      </div>

      {totalPendiente > 0 && (
        <div className="alert alert-danger">
          Tienes ${totalPendiente.toLocaleString()} pendiente de pago.
          Las multas bloquean nuevos prestamos y renovaciones.
        </div>
      )}

      {loading ? (
        <div className="text-center py-10 text-muted">Cargando...</div>
      ) : multas.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">--</p>
          <p>No tienes multas registradas</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Prestamo</th>
                  <th>Monto total</th>
                  <th>Monto pagado</th>
                  <th>Pendiente</th>
                  <th>Fecha generacion</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {multas.map(m => {
                  const pendiente = m.monto - m.montoPagado;
                  return (
                    <tr key={m.id}>
                      <td>Prestamo #{m.prestamoId}</td>
                      <td>${m.monto.toLocaleString()}</td>
                      <td>${m.montoPagado.toLocaleString()}</td>
                      <td className={m.estado === 'PENDIENTE' ? 'font-bold text-red-400' : ''}>
                        ${pendiente.toLocaleString()}
                      </td>
                      <td>{m.fechaGeneracion?.split('T')[0]}</td>
                      <td><Badge value={m.estado} /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}
    </div>
  );
}