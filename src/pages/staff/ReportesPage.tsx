// Pagina de reportes para bibliotecario y admin.
// Genera reportes de prestamos, multas e inventario con filtros por fecha.
// Cubre US-025, US-026 y US-027.

import { useState } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import type {
  ReportePrestamosResponse,
  ReporteMultasResponse,
  ReporteInventarioResponse,
} from '@/types';

type TabReporte = 'prestamos' | 'multas' | 'inventario';

// Union type para manejar los tres tipos de reporte
type DatosReporte =
  | ReportePrestamosResponse
  | ReporteMultasResponse
  | ReporteInventarioResponse
  | null;

export function ReportesPage() {
  const toast = useToast();

  const [tab,     setTab]     = useState<TabReporte>('prestamos');
  const [desde,   setDesde]   = useState('');
  const [hasta,   setHasta]   = useState('');
  const [reporte, setReporte] = useState<DatosReporte>(null);
  const [loading, setLoading] = useState(false);

  // Genera el reporte segun la pestana activa y los filtros de fecha
  async function generar() {
    setLoading(true);
    setReporte(null);
    try {
      let url = `/v1/reportes/${tab}`;

      // El reporte de inventario no usa filtros de fecha
      if (tab !== 'inventario') {
        const params = new URLSearchParams();
        if (desde) params.set('desde', `${desde}T00:00:00`);
        if (hasta) params.set('hasta', `${hasta}T23:59:59`);
        if ([...params].length) url += `?${params}`;
      }

      setReporte(await api.get<DatosReporte>(url));
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Convierte camelCase a texto legible: "totalPrestamos" -> "Total Prestamos"
  function formatearClave(clave: string): string {
    return clave
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, s => s.toUpperCase());
  }

  // Renderiza los datos del reporte como pares clave-valor
  function renderizarReporte() {
    if (!reporte) return null;
    return Object.entries(reporte).map(([clave, valor]) => (
      <tr key={clave}>
        <td className="text-muted font-medium">{formatearClave(clave)}</td>
        <td className="font-bold text-lg">
          {Array.isArray(valor)
            ? valor.join(', ')
            : typeof valor === 'number'
              ? valor.toLocaleString()
              : String(valor)}
        </td>
      </tr>
    ));
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

      {/* Selector de tipo de reporte */}
      <div className="flex gap-2 mb-6">
        {tabs.map(t => (
          <button
            key={t.key}
            className={`btn ${tab === t.key ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => { setTab(t.key); setReporte(null); }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filtros de fecha (no aplican para inventario) */}
      {tab !== 'inventario' && (
        <div className="flex gap-4 mb-5 flex-wrap">
          <div className="form-group">
            <label>Desde</label>
            <input type="date" value={desde} onChange={e => setDesde(e.target.value)} />
          </div>
          <div className="form-group">
            <label>Hasta</label>
            <input type="date" value={hasta} onChange={e => setHasta(e.target.value)} />
          </div>
          <div className="flex items-end">
            <button className="btn btn-primary" onClick={generar}>
              Generar reporte
            </button>
          </div>
        </div>
      )}

      {tab === 'inventario' && (
        <button className="btn btn-primary mb-5" onClick={generar}>
          Ver inventario actual
        </button>
      )}

      {/* Resultados */}
      {loading ? (
        <div className="text-center py-10 text-muted">Generando reporte...</div>
      ) : reporte ? (
        <div className="card">
          <div className="text-base font-semibold mb-4 capitalize">
            Reporte de {tab}
          </div>
          <div className="table-wrap">
            <table>
              <tbody>{renderizarReporte()}</tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
