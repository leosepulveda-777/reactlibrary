// Pagina de gestion de multas para bibliotecario y admin.
// Permite registrar pagos parciales o totales y condonar multas (solo admin).
// Cubre US-019, US-020 y US-021.

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

  const [multas,      setMultas]      = useState<MultaResponse[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(0);
  const [totalPages,  setTotalPages]  = useState(0);
  const [filtroEstado, setFiltroEstado] = useState('');

  // Estado del modal de pago
  const [pagoModal,   setPagoModal]   = useState<MultaResponse | null>(null);
  const [pago,        setPago]        = useState<PagoMultaRequest>({ monto: 0, metodoPago: 'EFECTIVO' });

  // Estado del modal de condonacion (solo admin)
  const [condModal,   setCondModal]   = useState<MultaResponse | null>(null);
  const [cond,        setCond]        = useState<CondonacionRequest>({ monto: 0, motivo: '' });

  useEffect(() => { cargar(); }, [page, filtroEstado]);

  // Carga todas las multas con filtro opcional por estado
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

  // Registra un pago parcial o total de una multa
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

  // Condona parcial o totalmente una multa (requiere rol ADMIN)
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

  const METODOS_PAGO = ['EFECTIVO', 'TARJETA', 'TRANSFERENCIA'];

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-3xl font-bold">Multas</h2>
        <p className="text-muted text-sm mt-1">Registro de pagos y condonaciones</p>
      </div>

      {/* Filtro por estado */}
      <div className="flex gap-3 mb-5">
        <select
          style={{ width: 200 }}
          value={filtroEstado}
          onChange={e => { setFiltroEstado(e.target.value); setPage(0); }}
        >
          <option value="">Todos los estados</option>
          <option value="PENDIENTE">Pendientes</option>
          <option value="PAGADA">Pagadas</option>
          <option value="CONDONADA">Condonadas</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted">Cargando...</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Prestamo</th>
                  <th>Monto total</th>
                  <th>Monto pagado</th>
                  <th>Pendiente</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {multas.map(m => {
                  const pendiente = m.monto - m.montoPagado;
                  return (
                    <tr key={m.id}>
                      <td className="text-muted">#{m.id}</td>
                      <td>Prestamo #{m.prestamoId}</td>
                      <td>${m.monto.toLocaleString()}</td>
                      <td>${m.montoPagado.toLocaleString()}</td>
                      <td className={m.estado === 'PENDIENTE' ? 'font-bold text-red-400' : ''}>
                        ${pendiente.toLocaleString()}
                      </td>
                      <td>{m.fechaGeneracion?.split('T')[0]}</td>
                      <td><Badge value={m.estado} /></td>
                      <td>
                        <div className="flex gap-1.5">
                          {m.estado === 'PENDIENTE' && (
                            <button
                              className="btn btn-sm btn-success"
                              onClick={() => { setPagoModal(m); setPago({ monto: 0, metodoPago: 'EFECTIVO' }); }}
                            >
                              Pagar
                            </button>
                          )}
                          {/* Condonar solo visible para administradores */}
                          {m.estado === 'PENDIENTE' && isAdmin && (
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={() => { setCondModal(m); setCond({ monto: 0, motivo: '' }); }}
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

      {/* Modal de registro de pago */}
      {pagoModal && (
        <Modal
          title={`Registrar pago - Multa #${pagoModal.id}`}
          onClose={() => setPagoModal(null)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setPagoModal(null)}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={registrarPago}>
                Registrar pago
              </button>
            </>
          }
        >
          <div className="alert alert-info">
            Monto pendiente: ${(pagoModal.monto - pagoModal.montoPagado).toLocaleString()}
          </div>
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label>Monto a pagar</label>
              <input
                type="number"
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

      {/* Modal de condonacion (solo admin) */}
      {condModal && (
        <Modal
          title={`Condonar multa #${condModal.id}`}
          onClose={() => setCondModal(null)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setCondModal(null)}>
                Cancelar
              </button>
              <button className="btn btn-danger" onClick={condonar}>
                Condonar
              </button>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label>Monto a condonar</label>
              <input
                type="number"
                value={cond.monto}
                onChange={e => setCond(prev => ({ ...prev, monto: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="form-group">
              <label>Motivo de la condonacion</label>
              <textarea
                value={cond.motivo}
                onChange={e => setCond(prev => ({ ...prev, motivo: e.target.value }))}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
