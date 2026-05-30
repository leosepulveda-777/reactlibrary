import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import type { ReservaResponse, PrestamoResponse, Page } from '@/types';

export function GestionReservasPage() {
  const toast = useToast();

  const [reservas,       setReservas]       = useState<ReservaResponse[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [page,           setPage]           = useState(0);
  const [totalPages,     setTotalPages]     = useState(0);
  const [filtroEstado,   setFiltroEstado]   = useState('');
  const [prestamoCreado, setPrestamoCreado] = useState<PrestamoResponse | null>(null);
  const [convirtiendo,   setConvirtiendo]   = useState<number | null>(null);

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
    if (!confirm('¿Cancelar esta reserva?')) return;
    try {
      await api.patch(`/v1/reservas/${reservaId}/cancelar?lectorId=${lectorId}`);
      toast('Reserva cancelada', 'success');
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  // Flujo alternativo: cierra la reserva sin crear préstamo
  async function confirmarEntrega(reservaId: number) {
    if (!confirm('¿Confirmar entrega manual?\nEsto cierra la reserva SIN registrar un préstamo.')) return;
    try {
      await api.patch(`/v1/reservas/${reservaId}/confirmar`);
      toast('Entrega confirmada', 'success');
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  // ★ Flujo principal: reserva → préstamo en un clic
  async function convertirAPrestamo(reservaId: number, tituloLibro: string) {
    if (!confirm(
      `¿Aceptar la reserva de "${tituloLibro}" y registrar el préstamo?\n\n` +
      `Se asignará automáticamente un ejemplar disponible.`
    )) return;

    setConvirtiendo(reservaId);
    try {
      const prestamo = await api.post<PrestamoResponse>(
        `/v1/reservas/${reservaId}/convertir-prestamo`, {}
      );
      toast('Préstamo registrado correctamente', 'success');
      setPrestamoCreado(prestamo);
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setConvirtiendo(null);
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-3xl font-bold">Reservas</h2>
        <p className="text-muted text-sm mt-1">Gestión de la cola de espera de libros</p>
      </div>

      {/* Banner préstamo creado */}
      {prestamoCreado && (
        <div style={{
          background: 'rgba(74,222,128,0.08)',
          border: '1px solid rgba(74,222,128,0.35)',
          borderRadius: 8, padding: '14px 18px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: 12,
        }}>
          <div>
            <p style={{ color: '#4ade80', fontWeight: 700, marginBottom: 4 }}>
              ✓ Préstamo #{prestamoCreado.id} registrado — podés entregar el libro al lector
            </p>
            <p className="text-sm">
              <span className="font-medium">{prestamoCreado.nombreLector}</span>
              <span className="text-muted font-mono text-xs ml-2">{prestamoCreado.numeroCarnet}</span>
              <span className="text-muted mx-2">·</span>
              {prestamoCreado.tituloLibro}
              {prestamoCreado.codigoEjemplar && (
                <span className="text-muted text-xs ml-2">
                  · Ejemplar: <span className="font-mono">{prestamoCreado.codigoEjemplar}</span>
                </span>
              )}
            </p>
            <p className="text-xs text-muted mt-1">
              Devolver antes del:{' '}
              <strong className="text-white">
                {prestamoCreado.fechaDevolucionEsperada?.split('T')[0]}
              </strong>
            </p>
          </div>
          <button
            onClick={() => setPrestamoCreado(null)}
            style={{ color: '#666', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}
          >✕</button>
        </div>
      )}

      {/* Filtro */}
      <div className="flex items-center gap-3 mb-5">
        <select
          style={{ width: 220 }}
          value={filtroEstado}
          onChange={e => { setFiltroEstado(e.target.value); setPage(0); }}
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendiente</option>
          <option value="DISPONIBLE">Lista para recoger</option>
          <option value="COMPLETADA">Completada</option>
          <option value="CANCELADA">Cancelada</option>
          <option value="EXPIRADA">Expirada</option>
        </select>
        {!loading && (
          <span className="text-xs text-muted">
            {reservas.length} resultado{reservas.length !== 1 ? 's' : ''}
          </span>
        )}
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
                      <div className="font-medium">{r.nombreLector ?? 'Lector desconocido'}</div>
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
                    <td>
                      <Badge value={r.estado} />
                      {r.estado === 'DISPONIBLE' && (
                        <div className="text-xs text-yellow-400 mt-0.5 font-semibold">
                          Esperando retiro
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="flex gap-1.5 flex-wrap">

                        {/* ★ BOTÓN PRINCIPAL */}
                        {(r.estado === 'PENDIENTE' || r.estado === 'DISPONIBLE') && (
                          <button
                            className="btn btn-sm btn-primary"
                            disabled={convirtiendo === r.id}
                            title="Registra el préstamo automáticamente y cierra la reserva"
                            onClick={() => convertirAPrestamo(r.id, r.tituloLibro ?? 'este libro')}
                          >
                            {convirtiendo === r.id ? 'Procesando…' : '📦 Aceptar y prestar'}
                          </button>
                        )}

                        {/* Solo marcar COMPLETADA sin préstamo — solo para DISPONIBLE */}
                        {r.estado === 'DISPONIBLE' && (
                          <button
                            className="btn btn-sm btn-success"
                            title="Marcar entregada sin registrar préstamo"
                            onClick={() => confirmarEntrega(r.id)}
                          >
                            Solo confirmar
                          </button>
                        )}

                        {(r.estado === 'PENDIENTE' || r.estado === 'DISPONIBLE') && (
                          <button
                            className="btn btn-sm btn-danger"
                            onClick={() => cancelar(r.id, r.lectorId)}
                          >
                            Cancelar
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
    </div>
  );
}