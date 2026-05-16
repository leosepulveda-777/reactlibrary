// Pagina de CRUD de categorias para bibliotecario y admin.
// Muestra el arbol de categorias con soporte para categorias padre e hijo.
// Cubre US-004.

import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { Modal } from '@/components/Modal';
import type { CategoriaResponse, CategoriaRequest } from '@/types';

const FORM_VACIO: CategoriaRequest = {
  nombre: '', descripcion: '', categoriaPadreId: null,
};

export function CategoriasPage() {
  const toast = useToast();

  const [categorias, setCategorias] = useState<CategoriaResponse[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [editId,     setEditId]     = useState<number | 'nueva' | null>(null);
  const [form,       setForm]       = useState<CategoriaRequest>(FORM_VACIO);

  useEffect(() => { cargar(); }, []);

  // Carga el arbol de categorias
  async function cargar() {
    setLoading(true);
    try {
      setCategorias(await api.get<CategoriaResponse[]>('/v1/catalogo/categorias'));
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Crea o actualiza una categoria
  async function guardar() {
    const body = {
      ...form,
      categoriaPadreId: form.categoriaPadreId ? Number(form.categoriaPadreId) : null,
    };
    try {
      if (editId === 'nueva') {
        await api.post('/v1/catalogo/categorias', body);
        toast('Categoria creada correctamente', 'success');
      } else {
        await api.put(`/v1/catalogo/categorias/${editId}`, body);
        toast('Categoria actualizada correctamente', 'success');
      }
      setEditId(null);
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  // Realiza soft delete de la categoria
  async function eliminar(id: number) {
    if (!confirm('Eliminar esta categoria?')) return;
    try {
      await api.delete(`/v1/catalogo/categorias/${id}`);
      toast('Categoria eliminada', 'success');
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  // Aplana el arbol de categorias para mostrar en tabla con indentacion
  function aplanar(lista: CategoriaResponse[], nivel = 0): Array<CategoriaResponse & { _nivel: number }> {
    return lista.flatMap(c => [
      { ...c, _nivel: nivel },
      ...aplanar(c.hijos ?? c.subcategorias ?? [], nivel + 1),
    ]);
  }

  const campo = (key: keyof CategoriaRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  const flat = aplanar(categorias);

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-3xl font-bold">Categorias</h2>
          <p className="text-muted text-sm mt-1">Arbol de categorias del catalogo</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setForm(FORM_VACIO); setEditId('nueva'); }}
        >
          Nueva categoria
        </button>
      </div>

      {loading ? (
        <div className="text-center py-10 text-muted">Cargando...</div>
      ) : (
        <div className="card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Descripcion</th>
                  <th>Activa</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {flat.map(c => (
                  <tr key={c.id}>
                    {/* Indentacion visual para mostrar jerarquia */}
                    <td style={{ paddingLeft: `${14 + c._nivel * 20}px` }}>
                      {c._nivel > 0 && <span className="text-muted mr-1">|--</span>}
                      {c.nombre}
                    </td>
                    <td className="text-muted">{c.descripcion ?? '—'}</td>
                    <td>
                      <span className={`badge ${c.activa ? 'badge-success' : 'badge-muted'}`}>
                        {c.activa ? 'Si' : 'No'}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1.5">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => {
                            setForm({
                              nombre: c.nombre,
                              descripcion: c.descripcion ?? '',
                              categoriaPadreId: c.categoriaPadreId ?? null,
                            });
                            setEditId(c.id);
                          }}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => eliminar(c.id)}
                        >
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal de creacion / edicion */}
      {editId !== null && (
        <Modal
          title={editId === 'nueva' ? 'Nueva categoria' : 'Editar categoria'}
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
              <label>Nombre</label>
              <input value={form.nombre} onChange={campo('nombre')} />
            </div>
            <div className="form-group">
              <label>Descripcion</label>
              <textarea value={form.descripcion ?? ''} onChange={campo('descripcion')} />
            </div>
            <div className="form-group">
              <label>ID de categoria padre (opcional)</label>
              <input
                type="number"
                value={form.categoriaPadreId ?? ''}
                onChange={e => setForm(prev => ({
                  ...prev,
                  categoriaPadreId: e.target.value ? parseInt(e.target.value) : null,
                }))}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
