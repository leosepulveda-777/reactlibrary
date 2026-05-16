// Pagina de reportes para bibliotecario y admin.
// Genera reportes de prestamos, multas e inventario con filtros por fecha.
// Cubre US-025, US-026 y US-027.

import { useState } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/Badge';
import type {
  ReportePrestamosResponse,
  ReporteMultasResponse,
  ReporteInventarioResponse,
} from '@/types';

type TabReporte = 'prestamos' | 'multas' | 'inventario';

export function ReportesPage() {
  const toast = useToast();

  const [tab,     setTab]     = useState<TabReporte>('prestamos');
  const [desde,   setDesde]   = useState('');
  const [hasta,   setHasta]   = useState('');
  const [loading, setLoading] = useState(false);

  const [reportePrestamos,  setReportePrestamos]  = useState<ReportePrestamosResponse | null>(null);
  const [reporteMultas,     setReporteMultas]     = useState<ReporteMultasResponse | null>(null);
  const [reporteInventario, setReporteInventario] = useState<ReporteInventarioResponse | null>(null);

  async function generar() {
    setLoading(true);
    try {
      let url = `/v1/reportes/${tab}`;
      if (tab !== 'inventario') {
        const params = new URLSearchParams();
        if (desde) params.set('desde', `${desde}T00:00:00`);
        if (hasta) params.set('hasta', `${hasta}T23:59:59`);
        if ([...params].length) url += `?${params}`;
      }
      const data = await api.get<ReportePrestamosResponse & ReporteMultasResponse & ReporteInventarioResponse>(url);
      if (tab === 'prestamos')  setReportePrestamos(data);
      if (tab === 'multas')     setReporteMultas(data);
      if (tab === 'inventario') setReporteInventario(data);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  const tabs: Array<{ key: TabReporte; label: string }> = [
    { key: 'prestamos',  label: 'Prestamos'  },
    { key: 'multas',     label: 'Multas'     },
    { key: 'inventario', label: 'Inventario' },
  ];

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-3xl font-bold">Reportes</h2>
        <p className="text-muted text-sm mt-1">Estadisticas y metricas del sistema</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filtros de fecha */}
      {tab !== 'inventario' && (
        <div className="flex gap-4 mb-5 flex-wrap items-end">
          <div className="form-group">
            <label>Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={generar} disabled={loading}>
            {loading ? 'Generando...' : 'Generar reporte'}
          </button>
        </div>
      )}

      {tab === 'inventario' && (
        <button className="btn btn-primary mb-5" onClick={generar} disabled={loading}>
          {loading ? 'Cargando...' : 'Ver inventario actual'}
        </button>
      )}

      {loading && <div className="text-center py-10 text-muted">Generando reporte...</div>}

      {/* ── Reporte de Prestamos ── */}
      {tab === 'prestamos' && reportePrestamos && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Tarjeta label="Total prestamos"  valor={reportePrestamos.totalPrestamos} />
            <Tarjeta label="Activos"          valor={reportePrestamos.prestamosActivos}   color="text-green-400" />
            <Tarjeta label="Vencidos"         valor={reportePrestamos.prestamosVencidos}  color="text-red-400" />
            <Tarjeta label="Devueltos"        valor={reportePrestamos.prestamosDevueltos} color="text-muted" />
            <Tarjeta label="Fisicos"          valor={reportePrestamos.prestamosFisicos} />
            <Tarjeta label="Digitales"        valor={reportePrestamos.prestamosDigitales} />
          </div>

          {(reportePrestamos.detalle?.length ?? 0) > 0 && (
            <div className="card">
              <div className="text-sm font-semibold mb-3">
                Detalle ({reportePrestamos.detalle!.length} registros)
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Libro</th>
                      <th>Lector</th>
                      <th>Tipo</th>
                      <th>Fecha prestamo</th>
                      <th>Devolucion esperada</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportePrestamos.detalle!.map(p => (
                      <tr key={p.id}>
                        <td className="max-w-[180px] truncate">{p.tituloLibro ?? '—'}</td>
                        <td>{p.nombreLector ?? `#${p.lectorId}`}</td>
                        <td><Badge value={p.tipo} /></td>
                        <td>{p.fechaPrestamo?.split('T')[0]}</td>
                        <td>{p.fechaDevolucionEsperada?.split('T')[0] ?? '—'}</td>
                        <td><Badge value={p.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Reporte de Multas ── */}
      {tab === 'multas' && reporteMultas && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Tarjeta label="Total multas"    valor={reporteMultas.totalMultas} />
            <Tarjeta label="Pendientes"      valor={reporteMultas.multasPendientes}  color="text-red-400" />
            <Tarjeta label="Pagadas"         valor={reporteMultas.multasPagadas}     color="text-green-400" />
            <Tarjeta label="Condonadas"      valor={reporteMultas.multasCondonadas}  color="text-muted" />
            <Tarjeta label="Monto total"     valor={`$${Number(reporteMultas.montoTotal ?? 0).toLocaleString()}`} />
            <Tarjeta label="Monto cobrado"   valor={`$${Number(reporteMultas.montoCobrado ?? 0).toLocaleString()}`} color="text-green-400" />
            <Tarjeta label="Monto pendiente" valor={`$${Number(reporteMultas.montoPendiente ?? 0).toLocaleString()}`} color="text-red-400" />
          </div>

          {(reporteMultas.detalle?.length ?? 0) > 0 && (
            <div className="card">
              <div className="text-sm font-semibold mb-3">
                Detalle ({reporteMultas.detalle!.length} registros)
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Lector</th>
                      <th>Libro</th>
                      <th>Dias retraso</th>
                      <th>Monto</th>
                      <th>Pendiente</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteMultas.detalle!.map(m => (
                      <tr key={m.id}>
                        <td>{m.nombreLector ?? `#${m.lectorId}`}</td>
                        <td className="max-w-[160px] truncate">{m.tituloLibro ?? '—'}</td>
                        <td className="text-center text-red-400 font-bold">{m.diasRetraso ?? '—'}</td>
                        <td>${Number(m.monto).toLocaleString()}</td>
                        <td>${(Number(m.monto) - Number(m.montoPagado)).toLocaleString()}</td>
                        <td><Badge value={m.estado} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Reporte de Inventario ── */}
      {tab === 'inventario' && reporteInventario && (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <Tarjeta label="Total libros"          valor={reporteInventario.totalLibros} />
            <Tarjeta label="Total ejemplares"      valor={reporteInventario.totalEjemplares} />
            <Tarjeta label="Disponibles"           valor={reporteInventario.ejemplaresDisponibles}    color="text-green-400" />
            <Tarjeta label="Prestados"             valor={reporteInventario.ejemplaresPrestados}      color="text-yellow-400" />
            <Tarjeta label="En mantenimiento"      valor={reporteInventario.ejemplaresEnMantenimiento} color="text-red-400" />
            <Tarjeta label="Libros digitales"      valor={reporteInventario.totalLibrosDigitales} />
          </div>

          {(reporteInventario.librosMasPrestados?.length ?? 0) > 0 && (
            <div className="card">
              <div className="text-sm font-semibold mb-3">Libros en catalogo</div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Titulo</th>
                      <th>ISBN</th>
                      <th>Tipo</th>
                      <th>Disponibles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reporteInventario.librosMasPrestados!.map(l => (
                      <tr key={l.id}>
                        <td className="font-medium max-w-[200px] truncate">{l.titulo}</td>
                        <td className="font-mono text-xs">{l.isbn}</td>
                        <td><Badge value={l.tipo} /></td>
                        <td>{l.ejemplaresDisponibles ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Componente de tarjeta de metrica
function Tarjeta({ label, valor, color }: { label: string; valor: string | number; color?: string }) {
  return (
    <div className="card text-center py-5">
      <div className={`text-3xl font-bold mb-1 ${color ?? ''}`}>{valor}</div>
      <div className="text-xs text-muted">{label}</div>
    </div>
  );
}
