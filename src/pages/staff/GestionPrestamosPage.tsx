import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import { Modal } from '@/components/Modal';
import type { PrestamoResponse, Page, TipoPrestamo } from '@/types';

export function GestionPrestamosPage() {
  const toast = useToast();

  const [prestamos,    setPrestamos]    = useState<PrestamoResponse[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(0);
  const [totalPages,   setTotalPages]   = useState(0);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showModal,    setShowModal]    = useState(false);

  const [tipo,       setTipo]       = useState<TipoPrestamo>('FISICO');
  const [lectorId,   setLectorId]   = useState('');
  const [ejemplarId, setEjemplarId] = useState('');
  const [digitalId,  setDigitalId]  = useState('');

  useEffect(() => { cargar(); }, [page, filtroEstado]);

  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '15' });
      if (filtroEstado) params.set('estado', filtroEstado);
      const res = await api.get<Page<PrestamoResponse>>(`/v1/prestamos?${params}`);
      setPrestamos(res.content ?? []);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function devolver(id: number) {
    if (!confirm('Registrar devolucion de este prestamo?')) return;
    try {
      await api.patch(`/v1/prestamos/${id}/devolver`);
      toast('Devolucion registrada correctamente', 'success');
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
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

  async function registrar() {
    try {
      if (tipo === 'FISICO') {
        await api.post('/v1/prestamos/fisico', {
          lectorId:   parseInt(lectorId),
          ejemplarId: parseInt(ejemplarId),
        });
      } else {
        await api.post('/v1/prestamos/digital', {
          lectorId:       parseInt(lectorId),
          libroDigitalId: parseInt(digitalId),
        });
      }
      toast('Prestamo registrado correctamente', 'success');
      setShowModal(false);
      resetForm();
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  function resetForm() {
    setLectorId(''); setEjemplarId(''); setDigitalId('');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-3xl font-bold">Prestamos</h2>
          <p className="text-muted text-sm mt-1">Registro y gestion de prestamos fisicos y digitales</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Nuevo prestamo
        </button>
      </div>

      <div className="flex gap-3 mb-5">
        <select
          style={{ width: 200 }}
          value={filtroEstado}
          onChange={e => { setFiltroEstado(e.target.value); setPage(0); }}
        >
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="DEVUELTO">Devuelto</option>
          <option value="VENCIDO">Vencido</option>
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
                  <th>Lector</th>
                  <th>Libro</th>
                  <th>Tipo</th>
                  <th>Fecha prestamo</th>
                  <th>Devolucion esperada</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {prestamos.map(p => (
                  <tr key={p.id}>
                    <td className="text-muted">#{p.id}</td>
                    <td>{p.nombreLector ?? `ID ${p.lectorId}`}</td>
                    <td className="max-w-[180px] truncate">{p.tituloLibro ?? '—'}</td>
                    <td><Badge value={p.esDigital ? 'DIGITAL' : 'FISICO'} /></td>
                    <td>{p.fechaPrestamo?.split('T')[0]}</td>
                    <td>{p.fechaDevolucionEsperada?.split('T')[0]}</td>
                    <td><Badge value={p.estado} /></td>
                    <td>
                      <div className="flex gap-1.5">
                        {p.estado === 'ACTIVO' && (
                          <button className="btn btn-sm btn-success" onClick={() => devolver(p.id)}>
                            Devolver
                          </button>
                        )}
                        {p.estado === 'ACTIVO' && p.numeroRenovaciones < 2 && (
                          <button className="btn btn-sm btn-secondary" onClick={() => renovar(p.id)}>
                            Renovar
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

      {showModal && (
        <Modal
          title="Nuevo prestamo"
          onClose={() => { setShowModal(false); resetForm(); }}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={registrar}>
                Registrar
              </button>
            </>
          }
        >
          <div className="flex gap-2 mb-5">
            {(['FISICO', 'DIGITAL'] as TipoPrestamo[]).map(t => (
              <button
                key={t}
                className={`btn ${tipo === t ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setTipo(t)}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            <div className="form-group">
              <label>ID del lector</label>
              <input
                type="number"
                value={lectorId}
                onChange={e => setLectorId(e.target.value)}
              />
            </div>

            {tipo === 'FISICO' ? (
              <div className="form-group">
                <label>ID del ejemplar fisico</label>
                <input
                  type="number"
                  value={ejemplarId}
                  onChange={e => setEjemplarId(e.target.value)}
                />
              </div>
            ) : (
              <div className="form-group">
                <label>ID del libro digital</label>
                <input
                  type="number"
                  value={digitalId}
                  onChange={e => setDigitalId(e.target.value)}
                />
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}