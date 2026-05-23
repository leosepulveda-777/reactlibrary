import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import { Modal } from '@/components/Modal';
import type { MultaResponse, PagoMultaRequest, CondonacionRequest, Page } from '@/types';

export function GestionMultasPage() {
  const { user } = useAuth();
  const toast    = useToast();
  const isAdmin  = user?.rol === 'ADMIN';

  const [multas,       setMultas]       = useState<MultaResponse[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(0);
  const [totalPages,   setTotalPages]   = useState(0);
  const [filtroEstado, setFiltroEstado] = useState('PENDIENTE');

  const [pagoModal, setPagoModal] = useState<MultaResponse | null>(null);
  const [pago,      setPago]      = useState<PagoMultaRequest>({ monto: 0, metodoPago: 'EFECTIVO' });

  const [condModal, setCondModal] = useState<MultaResponse | null>(null);
  const [cond,      setCond]      = useState<CondonacionRequest>({ motivoCondonacion: '' });

  const [detalleModal, setDetalleModal] = useState<MultaResponse | null>(null);

  useEffect(() => { cargar(); }, [page, filtroEstado]);

  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '15' });
      if (filtroEstado) params.set('estado', filtroEstado);
      const res = await api.get<Page<MultaResponse>>(`/v1/multas?${params}`);
      setMultas(res.content ?? []);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function registrarPago() {
    if (!pagoModal) return;
    try {
      await api.post(`/v1/multas/${pagoModal.id}/pagar`, pago);
      toast('Pago registrado correctamente', 'success');
      setPagoModal(null);
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function condonar() {
    if (!condModal) return;
    try {
      await api.post(`/v1/multas/${condModal.id}/condonar`, cond);
      toast('Multa condonada correctamente', 'success');
      setCondModal(null);
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  const totalPendiente = multas
    .filter(m => m.estado === 'PENDIENTE')
    .reduce((sum, m) => sum + (Number(m.monto) - Number(m.montoPagado)), 0);

  const METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-3xl font-bold">Multas</h2>
        <p className="text-muted text-sm mt-1">Registro de pagos y condonaciones</p>
      </div>

      {filtroEstado === 'PENDIENTE' && totalPendiente > 0 && (
        <div className="alert alert-danger mb-5">
          Total pendiente de cobro: <strong>${totalPendiente.toLocaleString()}</strong>
        </div>
      )}

      <div className="flex gap-3 mb-5">
        <select
          style={{ width: 220 }}
          value={filtroEstado}
          onChange={e => { setFiltroEstado(e.target.value); setPage(0); }}
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="PARCIALMENTE_PAGADA">Pago parcial</option>
          <option value="PAGADA">Pagadas</option>
          <option value="CONDONADA">Condonadas</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted">Cargando...</div>
      ) : multas.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">--</p>
          <p>No hay multas{filtroEstado ? ` con estado ${filtroEstado.toLowerCase()}` : ''}</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Lector</th>
                  <th>Libro</th>
                  <th>Dias retraso</th>
                  <th>Monto total</th>
                  <th>Pagado</th>
                  <th>Pendiente</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {multas.map(m => {
                  const pendiente = Number(m.monto) - Number(m.montoPagado);
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="font-medium">{m.nombreLector ?? `Lector #${m.lectorId}`}</div>
                        <div className="text-xs text-muted">{m.numeroCarnet}</div>
                      </td>
                      <td className="max-w-[160px] truncate">{m.tituloLibro ?? '—'}</td>
                      <td className="text-center">
                        <span className="font-bold text-red-400">{m.diasRetraso ?? '—'}</span>
                      </td>
                      <td>${Number(m.monto).toLocaleString()}</td>
                      <td>${Number(m.montoPagado).toLocaleString()}</td>
                      <td className={pendiente > 0 ? 'font-bold text-red-400' : 'text-muted'}>
                        ${pendiente.toLocaleString()}
                      </td>
                      <td>{m.fechaGeneracion?.split('T')[0]}</td>
                      <td><Badge value={m.estado} /></td>
                      <td>
                        <div className="flex gap-1.5 flex-wrap">
                          <button className="btn btn-sm btn-secondary" onClick={() => setDetalleModal(m)}>
                            Detalle
                          </button>
                          {(m.estado === 'PENDIENTE' || m.estado === 'PARCIALMENTE_PAGADA') && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => { setPagoModal(m); setPago({ monto: 0, metodoPago: 'EFECTIVO' }); }}
                            >
                              Pagar
                            </button>
                          )}
                          {(m.estado === 'PENDIENTE' || m.estado === 'PARCIALMENTE_PAGADA') && isAdmin && (
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => { setCondModal(m); setCond({ motivoCondonacion: '' }); }}
                            >
                              Condonar
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

      {detalleModal && (
        <Modal
          title={`Detalle multa — ${detalleModal.tituloLibro ?? ''}`}
          onClose={() => setDetalleModal(null)}
          actions={<button className="btn btn-secondary" onClick={() => setDetalleModal(null)}>Cerrar</button>}
        >
          <div className="grid grid-cols-2 gap-3 mb-5">
            {([
              ['Lector',       detalleModal.nombreLector ?? '—'],
              ['Carnet',       detalleModal.numeroCarnet ?? '—'],
              ['Dias retraso', String(detalleModal.diasRetraso ?? '—')],
              ['Monto total',  `$${Number(detalleModal.monto).toLocaleString()}`],
              ['Pagado',       `$${Number(detalleModal.montoPagado).toLocaleString()}`],
              ['Pendiente',    `$${(Number(detalleModal.monto) - Number(detalleModal.montoPagado)).toLocaleString()}`],
            ] as [string, string][]).map(([label, value]) => (
              <div key={label}>
                <div className="text-xs text-muted">{label}</div>
                <div className="font-medium">{value}</div>
              </div>
            ))}
            {detalleModal.motivoCondonacion && (
              <div className="col-span-2">
                <div className="text-xs text-muted">Motivo condonacion</div>
                <div className="font-medium">{detalleModal.motivoCondonacion}</div>
              </div>
            )}
          </div>
          {(detalleModal.pagos?.length ?? 0) > 0 && (
            <>
              <div className="text-sm font-semibold mb-2">Historial de pagos</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Metodo</th>
                      <th>Registrado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detalleModal.pagos!.map(p => (
                      <tr key={p.id}>
                        <td>{p.fechaPago?.split('T')[0]}</td>
                        <td>${Number(p.monto).toLocaleString()}</td>
                        <td>{p.metodoPago}</td>
                        <td className="text-muted text-xs">{p.registradoPor ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Modal>
      )}

      {pagoModal && (
        <Modal
          title={`Registrar pago — ${pagoModal.tituloLibro ?? `Multa #${pagoModal.id}`}`}
          onClose={() => setPagoModal(null)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setPagoModal(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={registrarPago}>Registrar pago</button>
            </>
          }
        >
          <div className="alert alert-info mb-4">
            Pendiente: <strong>${(Number(pagoModal.monto) - Number(pagoModal.montoPagado)).toLocaleString()}</strong>
            {' · '} Lector: <strong>{pagoModal.nombreLector}</strong>
          </div>
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label>Monto a pagar</label>
              <input
                type="number"
                min={0}
                value={pago.monto}
                onChange={e => setPago(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="form-group">
              <label>Metodo de pago</label>
              <select
                value={pago.metodoPago}
                onChange={e => setPago(prev => ({ ...prev, metodoPago: e.target.value }))}
              >
                {METODOS_PAGO.map(m => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </Modal>
      )}

      {condModal && (
        <Modal
          title={`Condonar multa — ${condModal.tituloLibro ?? `Multa #${condModal.id}`}`}
          onClose={() => setCondModal(null)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setCondModal(null)}>Cancelar</button>
              <button className="btn btn-danger" onClick={condonar}>Condonar</button>
            </>
          }
        >
          <div className="alert alert-danger mb-4">
            Monto total: <strong>${Number(condModal.monto).toLocaleString()}</strong>
            {' · '} Lector: <strong>{condModal.nombreLector}</strong>
          </div>
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label>Motivo de la condonacion</label>
              <textarea
                rows={3}
                value={cond.motivoCondonacion}
                onChange={e => setCond({ motivoCondonacion: e.target.value })}
                placeholder="Describe el motivo..."
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}