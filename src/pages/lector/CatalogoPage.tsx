// Pagina de catalogo de libros accesible para todos los roles.
// Permite buscar por titulo, ISBN y categoria, y ver el detalle de cada libro.
// Cubre US-009 y US-010.

import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import { Modal } from '@/components/Modal';
import type { LibroResponse, CategoriaResponse, Page } from '@/types';

export function CatalogoPage() {
  const toast = useToast();

  const [libros,      setLibros]      = useState<LibroResponse[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [titulo,      setTitulo]      = useState('');
  const [isbn,        setIsbn]        = useState('');
  const [catId,       setCatId]       = useState('');
  const [page,        setPage]        = useState(0);
  const [totalPages,  setTotalPages]  = useState(0);
  const [categorias,  setCategorias]  = useState<CategoriaResponse[]>([]);
  const [selected,    setSelected]    = useState<LibroResponse | null>(null);

  useEffect(() => { loadCategorias(); }, []);
  useEffect(() => { buscar(); }, [page, catId]);

  // Carga la lista de categorias para el filtro
  async function loadCategorias() {
    try {
      setCategorias(await api.get<CategoriaResponse[]>('/v1/catalogo/categorias'));
    } catch {
      // Si falla, el filtro queda vacio pero no bloquea la busqueda
    }
  }

  // Llama a GET /api/v1/catalogo/libros con los filtros activos
  async function buscar() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '12' });
      if (titulo) params.set('titulo', titulo);
      if (isbn)   params.set('isbn', isbn);
      if (catId)  params.set('categoriaId', catId);

      const res = await api.get<Page<LibroResponse>>(`/v1/catalogo/libros?${params}`);
      setLibros(res.content ?? []);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Carga el detalle completo de un libro para mostrarlo en el modal
  async function verDetalle(id: number) {
    try {
      setSelected(await api.get<LibroResponse>(`/v1/catalogo/libros/${id}`));
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h2 className="text-3xl font-bold">Catalogo de libros</h2>
        <p className="text-muted text-sm mt-1">
          Busca y descubre el acervo de la biblioteca
        </p>
      </div>

      {/* Barra de filtros */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <input
          className="flex-1 min-w-[200px]"
          placeholder="Buscar por titulo..."
          value={titulo}
          onChange={e => setTitulo(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscar()}
        />
        <input
          style={{ width: 150 }}
          placeholder="ISBN..."
          value={isbn}
          onChange={e => setIsbn(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && buscar()}
        />
        <select
          style={{ width: 200 }}
          value={catId}
          onChange={e => { setCatId(e.target.value); setPage(0); }}
        >
          <option value="">Todas las categorias</option>
          {categorias.map(c => (
            <option key={c.id} value={c.id}>{c.nombre}</option>
          ))}
        </select>
        <button className="btn btn-primary" onClick={buscar}>Buscar</button>
      </div>

      {/* Resultados */}
      {loading ? (
        <div className="text-center py-10 text-muted">Cargando libros...</div>
      ) : libros.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">--</p>
          <p>No se encontraron libros</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(210px,1fr))] gap-5">
            {libros.map(libro => (
              <div
                key={libro.id}
                className="bg-surface border border-border rounded-xl p-5 cursor-pointer
                           transition-all hover:border-accent hover:-translate-y-0.5"
                onClick={() => verDetalle(libro.id)}
              >
                {/* Portada del libro */}
                <div className="w-full h-36 bg-surface2 rounded-lg flex items-center justify-center text-3xl mb-3.5">
                  {libro.imagenUrl ? (
                    <img
                      src={libro.imagenUrl}
                      className="w-full h-full object-cover rounded-lg"
                      alt={libro.titulo}
                      onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                    />
                  ) : 'libro'}
                </div>

                <div className="text-sm font-semibold leading-tight mb-1.5 line-clamp-2">
                  {libro.titulo}
                </div>
                <div className="text-xs text-muted mb-1">
                  ID: {libro.id}
                </div>
                <div className="text-xs text-muted mb-2.5">
                  {libro.autores?.map(a => `${a.nombre} ${a.apellido}`).join(', ') || 'Autor desconocido'}
                </div>

                <div className="flex gap-1.5 flex-wrap">
                  <Badge value={libro.tipo} />
                  {(libro.ejemplaresDisponibles ?? 0) > 0 && (
                    <span className="badge badge-success">
                      {libro.ejemplaresDisponibles} disponibles
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Pagination page={page} totalPages={totalPages} onChange={p => { setPage(p); }} />
        </>
      )}

      {/* Modal de detalle */}
      {selected && (
        <DetalleLibroModal libro={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}

// Modal que muestra la informacion completa de un libro
function DetalleLibroModal({ libro, onClose }: { libro: LibroResponse; onClose: () => void }) {
  return (
    <Modal
      title={libro.titulo}
      onClose={onClose}
      actions={<button className="btn btn-secondary" onClick={onClose}>Cerrar</button>}
    >
      <div className="grid grid-cols-2 gap-3.5">
        <div>
          <div className="text-muted text-xs">ID</div>
          <div className="font-medium">{libro.id}</div>
        </div>
        <div>
          <div className="text-muted text-xs">ISBN</div>
          <div className="font-medium">{libro.isbn}</div>
        </div>
        <div>
          <div className="text-muted text-xs">Editorial</div>
          <div className="font-medium">{libro.editorial ?? '—'}</div>
        </div>
        <div>
          <div className="text-muted text-xs">Ano de publicacion</div>
          <div className="font-medium">{libro.anioPublicacion ?? '—'}</div>
        </div>
        <div>
          <div className="text-muted text-xs">Ejemplares disponibles</div>
          <div className="font-bold text-green-400 text-xl">
            {libro.ejemplaresDisponibles ?? '—'}
          </div>
        </div>
        <div className="col-span-2">
          <div className="text-muted text-xs">Tipo</div>
          <Badge value={libro.tipo} />
        </div>
        <div className="col-span-2">
          <div className="text-muted text-xs mb-1">Autores</div>
          <div>{libro.autores?.map(a => `${a.nombre} ${a.apellido}`).join(', ') || '—'}</div>
        </div>
        <div className="col-span-2">
          <div className="text-muted text-xs mb-1">Categorias</div>
          <div>{libro.categorias?.map(c => c.nombre).join(', ') || '—'}</div>
        </div>
        <div className="col-span-2">
          <div className="text-muted text-xs mb-1">Sinopsis</div>
          <p className="text-sm text-muted leading-relaxed">{libro.sinopsis || 'Sin sinopsis'}</p>
        </div>
        {(libro.digitales?.length ?? 0) > 0 && (
          <div className="col-span-2">
            <div className="text-muted text-xs mb-1">Formatos digitales</div>
            <div className="flex gap-2 flex-wrap">
              {libro.digitales!.map(d => (
                <span key={d.id} className="badge badge-info">
                  {d.formato} - {d.tamanioMb} MB
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
