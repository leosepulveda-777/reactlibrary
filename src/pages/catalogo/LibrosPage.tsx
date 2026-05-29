import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import { Modal } from '@/components/Modal';
import type { LibroResponse, LibroRequest, LibroDigitalRequest, TipoLibro, AutorResponse, CategoriaResponse, Page } from '@/types';

function generarISBN(): string {
  const prefix = '978';
  const digits = Array.from({ length: 9 }, () => Math.floor(Math.random() * 10)).join('');
  const base = prefix + digits;
  let sum = 0;
  for (let i = 0; i < 12; i++) sum += parseInt(base[i]) * (i % 2 === 0 ? 1 : 3);
  const check = (10 - (sum % 10)) % 10;
  return `${prefix}-${digits}-${check}`;
}

const FORM_VACIO: LibroRequest = {
  isbn: '', titulo: '', editorial: '', anioPublicacion: undefined,
  sinopsis: '', imagenPortada: '', tipo: 'FISICO', autorIds: [], categoriaIds: [], // ✅ imagenPortada
};

function useDebounce<T>(value: T, delay = 350): T {
  const [d, setD] = useState(value);
  useEffect(() => { const t = setTimeout(() => setD(value), delay); return () => clearTimeout(t); }, [value, delay]);
  return d;
}

export function LibrosPage() {
  const toast = useToast();

  const [libros,     setLibros]     = useState<LibroResponse[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [editId,     setEditId]     = useState<number | 'nuevo' | null>(null);
  const [form,       setForm]       = useState<LibroRequest>(FORM_VACIO);

  const [autorQuery,   setAutorQuery]   = useState('');
  const [autorResults, setAutorResults] = useState<AutorResponse[]>([]);
  const [autoresSelec, setAutoresSelec] = useState<AutorResponse[]>([]);
  const debouncedAutor = useDebounce(autorQuery);

  const [todasCats, setTodasCats] = useState<CategoriaResponse[]>([]);
  const [catsSelec, setCatsSelec] = useState<CategoriaResponse[]>([]);

  const [urlDigital, setUrlDigital] = useState('');

  useEffect(() => { cargar(); }, [page]);
  useEffect(() => { cargarCats(); }, []);

  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '15' });
      if (search) params.set('titulo', search);
      const res = await api.get<Page<LibroResponse>>(`/v1/catalogo/libros?${params}`);
      setLibros(res.content ?? []);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) { toast((e as Error).message, 'error'); }
    finally     { setLoading(false); }
  }

  async function cargarCats() {
    try {
      const res = await api.get<CategoriaResponse[]>('/v1/catalogo/categorias');
      const aplanar = (cats: CategoriaResponse[]): CategoriaResponse[] =>
        cats.flatMap(c => [c, ...aplanar(c.hijos ?? c.subcategorias ?? [])]);
      setTodasCats(aplanar(res));
    } catch { /* silencioso */ }
  }

  useEffect(() => {
    if (autorQuery.length < 2) { setAutorResults([]); return; }
    api.get<Page<AutorResponse>>(`/v1/catalogo/autores?search=${encodeURIComponent(autorQuery)}&size=6`)
      .then(r => setAutorResults(r.content ?? []))
      .catch(() => setAutorResults([]));
  }, [debouncedAutor]);

  async function guardar() {
    const body: LibroRequest = {
      ...form,
      isbn: form.isbn || generarISBN(),
      anioPublicacion: form.anioPublicacion ? Number(form.anioPublicacion) : undefined,
      autorIds:     autoresSelec.map(a => a.id),
      categoriaIds: catsSelec.map(c => c.id),
    };
    try {
      if (editId === 'nuevo') {
        const nuevoLibro = await api.post<LibroResponse>('/v1/catalogo/libros', body);
        if ((body.tipo === 'FISICO' || body.tipo === 'AMBOS') && nuevoLibro?.id) {
          const isbn = body.isbn.replace(/-/g, '').substring(0, 8);
          await api.post('/v1/catalogo/ejemplares', {
            libroId: nuevoLibro.id, codigoInventario: `INV-${isbn}-01`,
            ubicacion: 'Estante A-1', estado: 'DISPONIBLE',
          });
        }
        if ((body.tipo === 'DIGITAL' || body.tipo === 'AMBOS') && nuevoLibro?.id && urlDigital) {
          const req: LibroDigitalRequest = { libroId: nuevoLibro.id, urlArchivo: urlDigital, formato: 'PDF', tamanioMb: 0 }; // ✅ urlArchivo
          await api.post('/v1/catalogo/libros-digitales', req).catch(() => null);
        }
        toast('Libro creado correctamente', 'success');
      } else {
        await api.put(`/v1/catalogo/libros/${editId}`, body);
        toast('Libro actualizado', 'success');
      }
      setEditId(null); cargar();
    } catch (e) { toast((e as Error).message, 'error'); }
  }

  async function eliminar(id: number) {
    if (!confirm('¿Eliminar este libro?')) return;
    try { await api.delete(`/v1/catalogo/libros/${id}`); toast('Libro eliminado', 'success'); cargar(); }
    catch (e) { toast((e as Error).message, 'error'); }
  }

  function abrirNuevo() {
    setForm({ ...FORM_VACIO, isbn: generarISBN() });
    setAutoresSelec([]); setCatsSelec([]); setAutorQuery(''); setUrlDigital('');
    setEditId('nuevo');
  }

  function abrirEditar(libro: LibroResponse) {
    setForm({
      isbn: libro.isbn, titulo: libro.titulo, editorial: libro.editorial ?? '',
      anioPublicacion: libro.anioPublicacion, sinopsis: libro.sinopsis ?? '',
      imagenPortada: libro.imagenUrl ?? '', tipo: libro.tipo, // ✅ imagenPortada
      autorIds: libro.autores?.map(a => a.id) ?? [],
      categoriaIds: libro.categorias?.map(c => c.id) ?? [],
    });
    setAutoresSelec(libro.autores ?? []);
    setCatsSelec(libro.categorias ?? []);
    setEditId(libro.id);
  }

  const campo = (key: keyof LibroRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const resultBox: React.CSSProperties = {
    border: '1px solid #333', borderRadius: 6, marginTop: 4,
    background: '#1a1a2e', maxHeight: 180, overflowY: 'auto',
  };
  const resultItem: React.CSSProperties = {
    padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #2a2a3e',
  };

  const esNuevo = editId === 'nuevo';

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-3xl font-bold">Libros</h2>
          <p className="text-muted text-sm mt-1">Administración del catálogo de libros</p>
        </div>
        <button className="btn btn-primary" onClick={abrirNuevo}>Agregar libro</button>
      </div>

      <div className="flex gap-3 mb-5">
        <input className="flex-1" placeholder="Buscar por título..."
          value={search} onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && cargar()} />
        <button className="btn btn-secondary" onClick={cargar}>Buscar</button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted">Cargando...</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>ISBN</th><th>Título</th><th>Editorial</th>
                  <th>Año</th><th>Tipo</th><th>Activo</th><th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {libros.map(l => (
                  <tr key={l.id}>
                    <td className="font-mono text-xs">{l.isbn}</td>
                    <td className="font-medium max-w-[200px] truncate">{l.titulo}</td>
                    <td>{l.editorial ?? '—'}</td>
                    <td>{l.anioPublicacion ?? '—'}</td>
                    <td><Badge value={l.tipo} /></td>
                    <td><span className={`badge ${l.activo ? 'badge-success' : 'badge-muted'}`}>{l.activo ? 'Sí' : 'No'}</span></td>
                    <td>
                      <div className="flex gap-1.5">
                        <button className="btn btn-sm btn-secondary" onClick={() => abrirEditar(l)}>Editar</button>
                        <button className="btn btn-sm btn-danger" onClick={() => eliminar(l.id)}>Eliminar</button>
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

      {editId !== null && (
        <Modal
          title={esNuevo ? 'Nuevo libro' : 'Editar libro'}
          onClose={() => setEditId(null)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setEditId(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar</button>
            </>
          }
        >
          <div className="flex flex-col gap-4">

            <div className="form-group">
              <label>ISBN</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input style={{ flex: 1 }} value={form.isbn} onChange={campo('isbn')} placeholder="Se genera automático" />
                {esNuevo && (
                  <button className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}
                    onClick={() => setForm(p => ({ ...p, isbn: generarISBN() }))}>
                    🔄 Generar
                  </button>
                )}
              </div>
            </div>

            <div className="form-group">
              <label>Tipo</label>
              <select value={form.tipo} onChange={campo('tipo')}>
                {(['FISICO', 'DIGITAL', 'AMBOS'] as TipoLibro[]).map(t => <option key={t}>{t}</option>)}
              </select>
            </div>

            <div className="form-group">
              <label>Título</label>
              <input value={form.titulo} onChange={campo('titulo')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label>Editorial</label>
                <input value={form.editorial ?? ''} onChange={campo('editorial')} />
              </div>
              <div className="form-group">
                <label>Año de publicación</label>
                <input type="number" value={form.anioPublicacion ?? ''} onChange={campo('anioPublicacion')} />
              </div>
            </div>

            <div className="form-group">
              <label>URL imagen de portada</label>
              <input value={form.imagenPortada ?? ''} onChange={campo('imagenPortada')} placeholder="https://..." /> {/* ✅ imagenPortada */}
            </div>

            <div className="form-group">
              <label>Sinopsis</label>
              <textarea value={form.sinopsis ?? ''} onChange={campo('sinopsis')} />
            </div>

            {(form.tipo === 'DIGITAL' || form.tipo === 'AMBOS') && esNuevo && (
              <div className="form-group">
                <label>URL de descarga digital</label>
                <input value={urlDigital} onChange={e => setUrlDigital(e.target.value)} placeholder="https://..." />
              </div>
            )}

            <div className="form-group">
              <label>Autores</label>
              {autoresSelec.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                  {autoresSelec.map(a => (
                    <span key={a.id} style={{ background: '#2a2a3e', borderRadius: 20, padding: '3px 10px', fontSize: 12, display: 'flex', gap: 6, alignItems: 'center' }}>
                      {a.nombre} {a.apellido}
                      <button style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', padding: 0 }}
                        onClick={() => setAutoresSelec(prev => prev.filter(x => x.id !== a.id))}>✕</button>
                    </span>
                  ))}
                </div>
              )}
              <input type="text" placeholder="Busca un autor por nombre..."
                value={autorQuery} onChange={e => setAutorQuery(e.target.value)} />
              {autorResults.length > 0 && (
                <div style={resultBox}>
                  {autorResults.filter(a => !autoresSelec.find(s => s.id === a.id)).map(a => (
                    <div key={a.id} style={resultItem}
                      onMouseEnter={e => (e.currentTarget.style.background = '#2a2a3e')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                      onClick={() => { setAutoresSelec(prev => [...prev, a]); setAutorQuery(''); setAutorResults([]); }}>
                      {a.nombre} {a.apellido}
                      {a.nacionalidad && <span className="text-xs text-muted ml-2">{a.nacionalidad}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="form-group">
              <label>Categorías</label>
              <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid #333', borderRadius: 6, padding: '8px 12px' }}>
                {todasCats.map(c => (
                  <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '3px 0', cursor: 'pointer', fontSize: 13 }}>
                    <input type="checkbox"
                      checked={catsSelec.some(s => s.id === c.id)}
                      onChange={e => {
                        if (e.target.checked) setCatsSelec(prev => [...prev, c]);
                        else setCatsSelec(prev => prev.filter(s => s.id !== c.id));
                      }}
                    />
                    {c.nombre}
                  </label>
                ))}
              </div>
            </div>

          </div>
        </Modal>
      )}
    </div>
  );
}
