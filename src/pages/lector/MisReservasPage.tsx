import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { useLector } from '@/hooks/useLector';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import { Modal } from '@/components/Modal';
import type { ReservaResponse, LibroResponse, Page } from '@/types';

export function MisReservasPage() {
  const toast      = useToast();
  const { lector } = useLector();

  const [reservas,   setReservas]   = useState<ReservaResponse[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showModal,  setShowModal]  = useState(false);

  const [busqueda,          setBusqueda]          = useState('');
  const [resultados,        setResultados]        = useState<LibroResponse[]>([]);
  const [buscando,          setBuscando]          = useState(false);
  const [libroSeleccionado, setLibroSeleccionado] = useState<LibroResponse | null>(null);

  useEffect(() => { cargar(); }, [page, lector?.id]);

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

  async function buscarLibros() {
    if (!busqueda.trim()) return;
    setBuscando(true);
    setLibroSeleccionado(null);
    try {
      const params = new URLSearchParams({ titulo: busqueda, page: '0', size: '8' });
      const res = await api.get<Page<LibroResponse>>(`/v1/catalogo/libros?${params}`);
      setResultados(res.content ?? []);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setBuscando(false);
    }
  }

  async function crearReserva() {
    if (!libroSeleccionado) return;
    try {
      await api.post(`/v1/reservas/lector/${lector!.id}`, { libroId: libroSeleccionado.id });
      toast('Reserva creada correctamente', 'success');
      cerrarModal();
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  function cerrarModal() {
    setShowModal(false);
    setBusqueda('');
    setResultados([]);
    setLibroSeleccionado(null);
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
                  <th>Cola</th>
                  <th>Expira</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map(r => (
                  <tr key={r.id}>
                    <td className="font-medium">{r.tituloLibro ?? '—'}</td>
                    <td>{r.fechaReserva?.split('T')[0]}</td>
                    <td>#{r.posicionCola ?? '—'}</td>
                    <td>
                      {r.fechaExpiracion && (
                        <span className="text-xs text-muted">{r.fechaExpiracion.split('T')[0]}</span>
                      )}
                    </td>
                    <td><Badge value={r.estado} /></td>
                    <td>
                      {(r.estado === 'PENDIENTE' || r.estado === 'DISPONIBLE') && (
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
          onClose={cerrarModal}
          actions={
            <>
              <button className="btn btn-secondary" onClick={cerrarModal}>Cancelar</button>
              <button
                className="btn btn-primary"
                disabled={!libroSeleccionado}
                onClick={crearReserva}
              >
                Reservar
              </button>
            </>
          }
        >
          <div className="form-group mb-3">
            <label>Buscar libro por titulo</label>
            <div className="flex gap-2">
              <input
                className="flex-1"
                placeholder="Escribe el titulo del libro..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && buscarLibros()}
              />
              <button className="btn btn-secondary" onClick={buscarLibros} disabled={buscando}>
                {buscando ? '...' : 'Buscar'}
              </button>
            </div>
          </div>

          {resultados.length > 0 && !libroSeleccionado && (
            <div className="border border-border rounded-lg overflow-hidden mb-3">
              {resultados.map(libro => (
                <div
                  key={libro.id}
                  className="flex items-center justify-between px-4 py-2.5 cursor-pointer
                             hover:bg-surface2 border-b border-border last:border-b-0 transition-colors"
                  onClick={() => setLibroSeleccionado(libro)}
                >
                  <div>
                    <div className="font-medium text-sm">{libro.titulo}</div>
                    <div className="text-xs text-muted">
                      {libro.autores?.map(a => `${a.nombre} ${a.apellido}`).join(', ') || 'Autor desconocido'}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge value={libro.tipo} />
                    {(libro.ejemplaresDisponibles ?? 0) > 0 ? (
                      <span className="badge badge-success text-xs">
                        {libro.ejemplaresDisponibles} disp.
                      </span>
                    ) : (
                      <span className="badge badge-muted text-xs">Sin stock</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {resultados.length === 0 && busqueda && !buscando && (
            <p className="text-sm text-muted mb-3">No se encontraron libros con ese titulo.</p>
          )}

          {libroSeleccionado && (
            <div className="bg-surface2 border border-accent rounded-lg px-4 py-3 flex items-center justify-between">
              <div>
                <div className="text-xs text-muted mb-0.5">Libro seleccionado</div>
                <div className="font-semibold">{libroSeleccionado.titulo}</div>
                <div className="text-xs text-muted">
                  {libroSeleccionado.autores?.map(a => `${a.nombre} ${a.apellido}`).join(', ')}
                </div>
              </div>
              <button className="btn btn-sm btn-secondary" onClick={() => setLibroSeleccionado(null)}>
                Cambiar
              </button>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}