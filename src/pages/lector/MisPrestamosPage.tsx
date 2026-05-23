import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { useLector } from '@/hooks/useLector';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import type { PrestamoResponse, Page } from '@/types';

export function MisPrestamosPage() {
  const toast      = useToast();
  const { lector } = useLector();

  const [prestamos,  setPrestamos]  = useState<PrestamoResponse[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // lector?.id en vez de lector (objeto) para evitar loop infinito
  useEffect(() => { cargar(); }, [page, lector?.id]);

  async function cargar() {
    if (!lector?.id) return;
    setLoading(true);
    try {
      const res = await api.get<Page<PrestamoResponse>>(
        `/v1/prestamos/lector/${lector.id}?page=${page}&size=10`
      );
      setPrestamos(res.content ?? []);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function renovar(id: number) {
    try {
      await api.patch(`/v1/prestamos/${id}/renovar`);
      toast('Prestamo renovado correctamente', 'success');
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  function diasRestantes(fecha: string): number {
    return Math.ceil((new Date(fecha).getTime() - Date.now()) / 86_400_000);
  }

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-3xl font-bold">Mis prestamos</h2>
        <p className="text-muted text-sm mt-1">Prestamos activos e historial del ultimo ano</p>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted">Cargando...</div>
      ) : prestamos.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">--</p>
          <p>No tienes prestamos registrados</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Libro</th>
                  <th>Tipo</th>
                  <th>Fecha prestamo</th>
                  <th>Devolucion esperada</th>
                  <th>Estado</th>
                  <th>Renovaciones</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {prestamos.map(p => {
                  const dias = p.fechaDevolucionEsperada
                    ? diasRestantes(p.fechaDevolucionEsperada)
                    : null;

                  const diasColor =
                    dias === null      ? '' :
                    dias <= 0          ? 'text-red-400' :
                    dias <= 3          ? 'text-yellow-400' :
                    'text-muted';

                  return (
                    <tr key={p.id}>
                      <td className="font-medium">{p.tituloLibro ?? '—'}</td>
                      <td><Badge value={p.esDigital ? 'DIGITAL' : 'FISICO'} /></td>
                      <td>{p.fechaPrestamo?.split('T')[0]}</td>
                      <td>
                        <div>{p.fechaDevolucionEsperada?.split('T')[0]}</div>
                        {p.estado === 'ACTIVO' && dias !== null && (
                          <div className={`text-xs ${diasColor}`}>
                            {dias <= 0
                              ? `${Math.abs(dias)} dias vencido`
                              : `${dias} dias restantes`}
                          </div>
                        )}
                      </td>
                      <td><Badge value={p.estado} /></td>
                      <td>{p.numeroRenovaciones} / 2</td>
                      <td>
                        {p.estado === 'ACTIVO' && p.numeroRenovaciones < 2 && (
                          <button
                            className="btn btn-sm btn-secondary"
                            onClick={() => renovar(p.id)}
                          >
                            Renovar
                          </button>
                        )}
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
    </div>
  );
}