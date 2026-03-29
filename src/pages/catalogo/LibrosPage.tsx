// Pagina de CRUD de libros para bibliotecario y admin.
// Permite crear, editar, eliminar y buscar libros del catalogo.
// Cubre US-006.

import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { Badge } from '@/components/Badge';
import { Pagination } from '@/components/Pagination';
import { Modal } from '@/components/Modal';
import type { LibroResponse, LibroRequest, TipoLibro, Page } from '@/types';

// Estado inicial del formulario
const FORM_VACIO: LibroRequest = {
  isbn: '', titulo: '', editorial: '', anioPublicacion: undefined,
  sinopsis: '', imagenUrl: '', tipo: 'FISICO', autorIds: [], categoriaIds: [],
};

export function LibrosPage() {
  const toast = useToast();

  const [libros,      setLibros]      = useState<LibroResponse[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(0);
  const [totalPages,  setTotalPages]  = useState(0);

  // null = modal cerrado, 'nuevo' = creacion, numero = edicion
  const [editId,  setEditId]  = useState<number | 'nuevo' | null>(null);
  const [form,    setForm]    = useState<LibroRequest>(FORM_VACIO);

  useEffect(() => { cargar(); }, [page]);

  // Carga libros con busqueda por titulo
  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '15' });
      if (search) params.set('titulo', search);
      const res = await api.get<Page<LibroResponse>>(`/v1/catalogo/libros?${params}`);
      setLibros(res.content ?? []);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Crea o actualiza un libro segun si hay editId o es 'nuevo'
  async function guardar() {
    const body = {
      ...form,
      anioPublicacion: form.anioPublicacion ? Number(form.anioPublicacion) : undefined,
    };
    try {
      if (editId === 'nuevo') {
        await api.post('/v1/catalogo/libros', body);
        toast('Libro creado correctamente', 'success');
      } else {
        await api.put(`/v1/catalogo/libros/${editId}`, body);
        toast('Libro actualizado correctamente', 'success');
      }
      setEditId(null);
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  // Realiza soft delete del libro
  async function eliminar(id: number) {
    if (!confirm('Eliminar este libro del catalogo?')) return;
    try {
      await api.delete(`/v1/catalogo/libros/${id}`);
      toast('Libro eliminado', 'success');
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  // Abre modal de edicion con los datos del libro
  function abrirEditar(libro: LibroResponse) {
    setForm({
      isbn:            libro.isbn,
      titulo:          libro.titulo,
      editorial:       libro.editorial ?? '',
      anioPublicacion: libro.anioPublicacion,
      sinopsis:        libro.sinopsis ?? '',
      imagenUrl:       libro.imagenUrl ?? '',
      tipo:            libro.tipo,
      autorIds:        libro.autores?.map(a => a.id) ?? [],
      categoriaIds:    libro.categorias?.map(c => c.id) ?? [],
    });
    setEditId(libro.id);
  }

  // Actualiza un campo del formulario
  const campo = (key: keyof LibroRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  // Convierte string de IDs separados por coma a array de numeros
  const parsearIds = (val: string): number[] =>
    val.split(',').map(x => parseInt(x.trim())).filter(Boolean);

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-3xl font-bold">Libros</h2>
          <p className="text-muted text-sm mt-1">Administracion del catalogo de libros</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setForm(FORM_VACIO); setEditId('nuevo'); }}
        >
          Agregar libro
        </button>
      </div>

      {/* Busqueda */}
      <div className="flex gap-3 mb-5">
        <input
          className="flex-1"
          placeholder="Buscar por titulo..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && cargar()}
        />
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
                  <th>ISBN</th>
                  <th>Titulo</th>
                  <th>Editorial</th>
                  <th>Ano</th>
                  <th>Tipo</th>
                  <th>Activo</th>
                  <th>Acciones</th>
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
                    <td>
                      <span className={`badge ${l.activo ? 'badge-success' : 'badge-muted'}`}>
                        {l.activo ? 'Si' : 'No'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        <button className="btn btn-sm btn-secondary" onClick={() => abrirEditar(l)}>
                          Editar
                        </button>
                        <button className="btn btn-sm btn-danger" onClick={() => eliminar(l.id)}>
                          Eliminar
                        </button>
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

      {/* Modal de creacion / edicion */}
      {editId !== null && (
        <Modal
          title={editId === 'nuevo' ? 'Nuevo libro' : 'Editar libro'}
          onClose={() => setEditId(null)}
          actions={
            <>
              <button className="btn btn-secondary" onClick={() => setEditId(null)}>Cancelar</button>
              <button className="btn btn-primary" onClick={guardar}>Guardar</button>
            </>
          }
        >
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group">
              <label>ISBN</label>
              <input value={form.isbn} onChange={campo('isbn')} />
            </div>
            <div className="form-group">
              <label>Tipo</label>
              <select value={form.tipo} onChange={campo('tipo')}>
                {(['FISICO', 'DIGITAL', 'AMBOS'] as TipoLibro[]).map(t => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="form-group col-span-2">
              <label>Titulo</label>
              <input value={form.titulo} onChange={campo('titulo')} />
            </div>
            <div className="form-group">
              <label>Editorial</label>
              <input value={form.editorial ?? ''} onChange={campo('editorial')} />
            </div>
            <div className="form-group">
              <label>Ano de publicacion</label>
              <input type="number" value={form.anioPublicacion ?? ''} onChange={campo('anioPublicacion')} />
            </div>
            <div className="form-group col-span-2">
              <label>URL de imagen de portada</label>
              <input value={form.imagenUrl ?? ''} onChange={campo('imagenUrl')} />
            </div>
            <div className="form-group col-span-2">
              <label>Sinopsis</label>
              <textarea value={form.sinopsis ?? ''} onChange={campo('sinopsis')} />
            </div>
            <div className="form-group">
              <label>IDs de autores (separados por coma)</label>
              <input
                value={(form.autorIds ?? []).join(', ')}
                onChange={e => setForm(prev => ({ ...prev, autorIds: parsearIds(e.target.value) }))}
                placeholder="1, 2, 3"
              />
            </div>
            <div className="form-group">
              <label>IDs de categorias (separados por coma)</label>
              <input
                value={(form.categoriaIds ?? []).join(', ')}
                onChange={e => setForm(prev => ({ ...prev, categoriaIds: parsearIds(e.target.value) }))}
                placeholder="1, 2"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
