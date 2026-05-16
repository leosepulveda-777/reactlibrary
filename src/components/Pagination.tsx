// Componente de paginacion.
// Muestra hasta 5 paginas alrededor de la actual y botones de anterior/siguiente.

interface PaginationProps {
  page: number;        // Pagina actual (base 0)
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Calcula el rango de paginas a mostrar centrado en la actual
  const start = Math.max(0, Math.min(page - 2, totalPages - 5));
  const pages = Array.from({ length: Math.min(5, totalPages) }, (_, i) => start + i);

  return (
    <div className="flex items-center gap-2 mt-5 justify-center">
      <button className="page-btn" disabled={page === 0} onClick={() => onChange(page - 1)}>
        anterior
      </button>

      {pages.map(p => (
        <button
          key={p}
          className={`page-btn ${p === page ? 'active' : ''}`}
          onClick={() => onChange(p)}
        >
          {p + 1}
        </button>
      ))}

      <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => onChange(page + 1)}>
        siguiente
      </button>
    </div>
  );
}
