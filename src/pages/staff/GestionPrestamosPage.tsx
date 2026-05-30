import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import { Modal } from '@/components/Modal';
import type {
  PrestamoResponse, LectorResponse, LibroResponse,
  EjemplarResponse, MultaResponse, Page, TipoPrestamo,
} from '@/types';

function useDebounce<T>(value: T, delay = 350): T {
  const [d, setD] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setD(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return d;
}

export function GestionPrestamosPage() {
  const toast = useToast();

  const [prestamos,    setPrestamos]    = useState<PrestamoResponse[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [page,         setPage]         = useState(0);
  const [totalPages,   setTotalPages]   = useState(0);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [showModal,    setShowModal]    = useState(false);
  const [tipo,         setTipo]         = useState<TipoPrestamo>('FISICO');

  const [lectorQuery,    setLectorQuery]    = useState('');
  const [lectorResults,  setLectorResults]  = useState<LectorResponse[]>([]);
  const [lectorSelected, setLectorSelected] = useState<LectorResponse | null>(null);
  const [loadingLector,  setLoadingLector]  = useState(false);

  const [libroQuery,    setLibroQuery]    = useState('');
  const [libroResults,  setLibroResults]  = useState<LibroResponse[]>([]);
  const [libroSelected, setLibroSelected] = useState<LibroResponse | null>(null);
  const [loadingLibro,  setLoadingLibro]  = useState(false);

  const [ejemplar,      setEjemplar]      = useState<EjemplarResponse | null>(null);
  const [multaGenerada, setMultaGenerada] = useState<MultaResponse | null>(null);

  const debouncedLector = useDebounce(lectorQuery);
  const debouncedLibro  = useDebounce(libroQuery);

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

  useEffect(() => {
    if (lectorSelected || debouncedLector.length < 2) { setLectorResults([]); return; }
    setLoadingLector(true);
    api.get<Page<LectorResponse>>(`/v1/lectores?search=${encodeURIComponent(debouncedLector)}&size=6`)
      .then(r => setLectorResults(r.content ?? []))
      .catch(() => setLectorResults([]))
      .finally(() => setLoadingLector(false));
  }, [debouncedLector]);

  useEffect(() => {
    if (libroSelected || debouncedLibro.length < 2) { setLibroResults([]); return; }
    setLoadingLibro(true);
    api.get<Page<LibroResponse>>(`/v1/catalogo/libros?titulo=${encodeURIComponent(debouncedLibro)}&size=6`)
      .then(r => setLibroResults(r.content ?? []))
      .catch(() => setLibroResults([]))
      .finally(() => setLoadingLibro(false));
  }, [debouncedLibro]);

  useEffect(() => {
    if (!libroSelected || tipo !== 'FISICO') { setEjemplar(null); return; }
    api.get<EjemplarResponse[]>(`/v1/catalogo/libros/${libroSelected.id}/ejemplares`)
      .then(lista => {
        const disp = lista.find(e => e.estado === 'DISPONIBLE') ?? null;
        setEjemplar(disp);
        if (!disp) toast('No hay ejemplares disponibles para este libro', 'error');
      })
      .catch(() => setEjemplar(null));
  }, [libroSelected, tipo]);

  async function registrar() {
    if (!lectorSelected) { toast('Selecciona un lector', 'error'); return; }
    if (!libroSelected)  { toast('Selecciona un libro',  'error'); return; }
    try {
      if (tipo === 'FISICO') {
        if (!ejemplar) { toast('No hay ejemplares disponibles', 'error'); return; }
        await api.post('/v1/prestamos/fisico', {
          lectorId: lectorSelected.id,
          ejemplarId: ejemplar.id,
        });
      } else {
        const digitalId = libroSelected.digitales?.[0]?.id;
        if (!digitalId) { toast('Este libro no tiene versión digital', 'error'); return; }
        await api.post('/v1/prestamos/digital', {
          lectorId: lectorSelected.id,
          libroDigitalId: digitalId,
        });
      }
      toast('Préstamo registrado correctamente', 'success');
      setShowModal(false);
      resetForm();
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  function resetForm() {
    setLectorQuery(''); setLectorSelected(null); setLectorResults([]);
    setLibroQuery('');  setLibroSelected(null);  setLibroResults([]);
    setEjemplar(null);  setTipo('FISICO');
  }

  async function devolver(prestamo: PrestamoResponse) {
    if (!confirm('¿Registrar devolución?')) return;
    try {
      await api.patch(`/v1/prestamos/${prestamo.id}/devolver`);

      // Si venía vencido, buscar la multa recién generada para mostrar el banner
      if (prestamo.vencido) {
        try {
          await new Promise(r => setTimeout(r, 400));
          const res = await api.get<Page<MultaResponse>>(`/v1/multas?estado=PENDIENTE&size=5`);
          const nueva = res.content?.find(m => m.lectorId === prestamo.lectorId) ?? null;
          if (nueva) setMultaGenerada(nueva);
        } catch {
          // no crítico
        }
      }

      toast('Devolución registrada', 'success');
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  async function renovar(id: number) {
    try {
      await api.patch(`/v1/prestamos/${id}/renovar`);
      toast('Préstamo renovado', 'success');
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  const resultItem: React.CSSProperties = {
    padding: '9px 12px', cursor: 'pointer',
    borderBottom: '1px solid #2a2a3e', transition: 'background 0.1s',
  };
  const resultBox: React.CSSProperties = {
    border: '1px solid #333', borderRadius: 6, marginTop: 4,
    background: '#1a1a2e', maxHeight: 200, overflowY: 'auto',
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-3xl font-bold">Préstamos</h2>
          <p className="text-muted text-sm mt-1">Registro y gestión de préstamos físicos y digitales</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Nuevo préstamo
        </button>
      </div>

      {/* Banner multa generada */}
      {multaGenerada && (
        <div style={{
          background: 'rgba(251,191,36,0.08)',
          border: '1px solid rgba(251,191,36,0.4)',
          borderRadius: 8, padding: '14px 18px', marginBottom: 20,
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', gap: 12,
        }}>
          <div>
            <p style={{ color: '#fbbf24', fontWeight: 700, marginBottom: 4 }}>
              ⚠️ Se generó una multa por devolución con retraso
            </p>
            <p className="text-sm">
              <span className="font-medium">{multaGenerada.nombreLector}</span>
              <span className="text-muted text-xs ml-2">{multaGenerada.numeroCarnet}</span>
              <span className="text-muted mx-2">·</span>
              <span className="font-bold" style={{ color: '#fbbf24' }}>
                ${Number(multaGenerada.monto).toLocaleString()}
              </span>
              <span className="text-muted text-xs ml-2">
                ({multaGenerada.diasRetraso} día{multaGenerada.diasRetraso !== 1 ? 's' : ''} de retraso)
              </span>
            </p>
            <p className="text-xs text-muted mt-1">
              Andá a <strong className="text-white">Multas</strong> para registrar el pago.
            </p>
          </div>
          <button
            onClick={() => setMultaGenerada(null)}
            style={{ color: '#666', fontSize: 18, background: 'none', border: 'none', cursor: 'pointer' }}
          >✕</button>
        </div>
      )}

      {/* Filtro */}
      <div className="flex gap-3 mb-5">
        <select style={{ width: 200 }} value={filtroEstado}
          onChange={e => { setFiltroEstado(e.target.value); setPage(0); }}>
          <option value="">Todos los estados</option>
          <option value="ACTIVO">Activo</option>
          <option value="RENOVADO">Renovado</option>
          <option value="DEVUELTO">Devuelto</option>
          <option value="VENCIDO">Vencido</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted">Cargando...</div>
      ) : prestamos.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">--</p>
          <p>No hay préstamos{filtroEstado ? ` con estado ${filtroEstado}` : ''}</p>
        </div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ID</th><th>Lector</th><th>Libro</th><th>Tipo</th>
                  <th>Fecha préstamo</th><th>Devolución esperada</th><th>Estado</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {prestamos.map(p => (
                  <tr key={p.id}>
                    <td className="text-muted">#{p.id}</td>
                    <td>
                      <div className="font-medium">{p.nombreLector ?? `ID ${p.lectorId}`}</div>
                      {p.numeroCarnet && <div className="text-xs text-muted font-mono">{p.numeroCarnet}</div>}
                    </td>
                    <td className="max-w-[180px] truncate">{p.tituloLibro ?? '—'}</td>
                    <td><Badge value={p.esDigital ? 'DIGITAL' : 'FISICO'} /></td>
                    <td>{p.fechaPrestamo?.split('T')[0]}</td>
                    <td>
                      <span className={p.vencido ? 'text-red-400 font-semibold' : ''}>
                        {p.fechaDevolucionEsperada?.split('T')[0]}
                      </span>
                      {p.vencido && (
                        <div className="text-xs text-red-400">{p.diasRetraso}d de atraso</div>
                      )}
                    </td>
                    <td><Badge value={p.estado} /></td>
                    <td>
                      <div className="flex gap-1.5">
                        {(p.estado === 'ACTIVO' || p.estado === 'RENOVADO' || p.estado === 'VENCIDO') && (
                          <button
                            className="btn btn-sm btn-success"
                            title={p.vencido ? 'Devolución tardía — se generará multa automáticamente' : 'Registrar devolución'}
                            onClick={() => devolver(p)}
                          >
                            {p.vencido ? '⚠️ Devolver' : 'Devolver'}
                          </button>
                        )}
                        {(p.estado === 'ACTIVO' || p.estado === 'RENOVADO') && p.numeroRenovaciones < 2 && (
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

      {/* Modal nuevo préstamo */}
      {showModal && (
        <Modal
          title="Nuevo préstamo"
          onClose={() => { setShowModal(false); resetForm(); }}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => { setShowModal(false); resetForm(); }}>
                Cancelar
              </button>
              <button className="btn btn-primary" onClick={registrar}>Registrar</button>
            </>
          }
        >
          <div className="flex gap-2 mb-5">
            {(['FISICO', 'DIGITAL'] as TipoPrestamo[]).map(t => (
              <button key={t}
                className={`btn ${tipo === t ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => { setTipo(t); setLibroSelected(null); setLibroQuery(''); setEjemplar(null); }}>
                {t}
              </button>
            ))}
          </div>

          <div className="flex flex-col gap-4">

            {/* Lector */}
            <div className="form-group">
              <label>Lector</label>
              {lectorSelected ? (
                <div style={{ background: '#1a1a2e', borderRadius: 6, padding: '10px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span className="font-medium">{lectorSelected.nombre} {lectorSelected.apellido}</span>
                    <span className="text-xs text-muted ml-2 font-mono">{lectorSelected.numeroCarnet}</span>
                    {(lectorSelected.multasPendientes ?? 0) > 0 && (
                      <div className="text-xs mt-1" style={{ color: '#fbbf24' }}>
                        ⚠️ Tiene {lectorSelected.multasPendientes} multa{lectorSelected.multasPendientes !== 1 ? 's' : ''} pendiente{lectorSelected.multasPendientes !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                  <button className="text-xs text-muted hover:text-white"
                    onClick={() => { setLectorSelected(null); setLectorQuery(''); }}>✕ cambiar</button>
                </div>
              ) : (
                <div>
                  <input type="text" placeholder="Escribe el nombre del lector..."
                    value={lectorQuery} autoFocus onChange={e => setLectorQuery(e.target.value)} />
                  {loadingLector && <div className="text-xs text-muted mt-1">Buscando...</div>}
                  {lectorResults.length > 0 && (
                    <div style={resultBox}>
                      {lectorResults.map(l => (
                        <div key={l.id} style={resultItem}
                          onMouseEnter={e => (e.currentTarget.style.background = '#2a2a3e')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => { setLectorSelected(l); setLectorQuery(''); setLectorResults([]); }}>
                          <div className="font-medium">{l.nombre} {l.apellido}</div>
                          <div className="text-xs text-muted font-mono">
                            {l.numeroCarnet} · {l.email}
                            {(l.multasPendientes ?? 0) > 0 && (
                              <span style={{ color: '#fbbf24', marginLeft: 6 }}>
                                ⚠️ {l.multasPendientes} multa{l.multasPendientes !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!loadingLector && lectorQuery.length >= 2 && lectorResults.length === 0 && (
                    <div className="text-xs text-muted mt-1">Sin resultados para "{lectorQuery}"</div>
                  )}
                </div>
              )}
            </div>

            {/* Libro */}
            <div className="form-group">
              <label>Libro {tipo === 'DIGITAL' ? '(digital)' : '(físico)'}</label>
              {libroSelected ? (
                <div style={{ background: '#1a1a2e', borderRadius: 6, padding: '10px 12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="font-medium">{libroSelected.titulo}</span>
                    <button className="text-xs text-muted hover:text-white"
                      onClick={() => { setLibroSelected(null); setLibroQuery(''); setEjemplar(null); }}>✕ cambiar</button>
                  </div>
                  {tipo === 'FISICO' && (
                    <div className="text-xs mt-1">
                      {ejemplar
                        ? <span style={{ color: '#4ade80' }}>✓ Ejemplar: <span className="font-mono">{ejemplar.codigoBarras}</span>{ejemplar.ubicacion ? ` · ${ejemplar.ubicacion}` : ''}</span>
                        : <span className="text-red-400">✗ Sin ejemplares disponibles</span>}
                    </div>
                  )}
                  {tipo === 'DIGITAL' && (
                    <div className="text-xs mt-1">
                      {libroSelected.digitales?.length
                        ? <span style={{ color: '#4ade80' }}>✓ Digital disponible ({libroSelected.digitales[0].formato})</span>
                        : <span className="text-red-400">✗ No tiene versión digital</span>}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <input type="text" placeholder="Escribe el título del libro..."
                    value={libroQuery} onChange={e => setLibroQuery(e.target.value)} />
                  {loadingLibro && <div className="text-xs text-muted mt-1">Buscando...</div>}
                  {libroResults.length > 0 && (
                    <div style={resultBox}>
                      {libroResults.map(l => (
                        <div key={l.id} style={resultItem}
                          onMouseEnter={e => (e.currentTarget.style.background = '#2a2a3e')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          onClick={() => { setLibroSelected(l); setLibroQuery(''); setLibroResults([]); }}>
                          <div className="font-medium">{l.titulo}</div>
                          <div className="text-xs text-muted">
                            {l.autores?.map(a => `${a.nombre} ${a.apellido}`).join(', ')}
                            {l.ejemplaresDisponibles !== undefined && <span className="ml-2">· {l.ejemplaresDisponibles} disp.</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {!loadingLibro && libroQuery.length >= 2 && libroResults.length === 0 && (
                    <div className="text-xs text-muted mt-1">Sin resultados para "{libroQuery}"</div>
                  )}
                </div>
              )}
            </div>

          </div>
        </Modal>
      )}
    </div>
  );
}