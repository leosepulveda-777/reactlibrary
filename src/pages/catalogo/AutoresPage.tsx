// Pagina de CRUD de autores para bibliotecario y admin.
// Permite crear, editar, eliminar y buscar autores.
// Cubre US-005.

import { useState, useEffect } from 'react';
import { api } from '@/api/client';
import { useToast } from '@/contexts/ToastContext';
import { Pagination } from '@/components/Pagination';
import { Modal } from '@/components/Modal';
import type { AutorResponse, AutorRequest, Page } from '@/types';

const FORM_VACIO: AutorRequest = {
  nombre: '', apellido: '', nacionalidad: '',
  fechaNacimiento: '', fechaFallecimiento: '', biografia: '',
};

export function AutoresPage() {
  const toast = useToast();

  const [autores,     setAutores]     = useState<AutorResponse[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(0);
  const [totalPages,  setTotalPages]  = useState(0);
  const [editId,      setEditId]      = useState<number | 'nuevo' | null>(null);
  const [form,        setForm]        = useState<AutorRequest>(FORM_VACIO);

  useEffect(() => { cargar(); }, [page]);

  // Carga autores con busqueda por nombre
  async function cargar() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), size: '15' });
      if (search) params.set('search', search);
      const res = await api.get<Page<AutorResponse>>(`/v1/catalogo/autores?${params}`);
      setAutores(res.content ?? []);
      setTotalPages(res.totalPages ?? 1);
    } catch (e) {
      toast((e as Error).message, 'error');
    } finally {
      setLoading(false);
    }
  }

  // Crea o actualiza un autor
  async function guardar() {
    try {
      if (editId === 'nuevo') {
        await api.post('/v1/catalogo/autores', form);
        toast('Autor creado correctamente', 'success');
      } else {
        await api.put(`/v1/catalogo/autores/${editId}`, form);
        toast('Autor actualizado correctamente', 'success');
      }
      setEditId(null);
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  // Realiza soft delete del autor
  async function eliminar(id: number) {
    if (!confirm('Eliminar este autor?')) return;
    try {
      await api.delete(`/v1/catalogo/autores/${id}`);
      toast('Autor eliminado', 'success');
      cargar();
    } catch (e) {
      toast((e as Error).message, 'error');
    }
  }

  const campo = (key: keyof AutorRequest) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));

  return (
    <div>
      <div className="flex items-center justify-between mb-7">
        <div>
          <h2 className="text-3xl font-bold">Autores</h2>
          <p className="text-muted text-sm mt-1">Administracion de autores del catalogo</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => { setForm(FORM_VACIO); setEditId('nuevo'); }}
        >
          Agregar autor
        </button>
      </div>

      {/* Busqueda */}
      <div className="flex gap-3 mb-5">
        <input
          className="flex-1"
          placeholder="Buscar autor por nombre..."
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
                  <th>Nombre</th>
                  <th>Apellido</th>
                  <th>Nacionalidad</th>
                  <th>Nacimiento</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {autores.map(a => (
                  <tr key={a.id}>
                    <td>{a.nombre}</td>
                    <td>{a.apellido}</td>
                    <td>{a.nacionalidad ?? '—'}</td>
                    <td>{a.fechaNacimiento ?? '—'}</td>
                    <td>
                      <div className="flex gap-1.5">
                        <button
                          className="btn btn-sm btn-secondary"
                          onClick={() => { setForm({ ...a }); setEditId(a.id); }}
                        >
                          Editar
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => eliminar(a.id)}
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
          <Pagination page={page} totalPages={totalPages} onChange={setPage} />
        </div>
      )}

      {/* Modal de creacion / edicion */}
      {editId !== null && (
        <Modal
          title={editId === 'nuevo' ? 'Nuevo autor' : 'Editar autor'}
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
              <label>Nombre</label>
              <input value={form.nombre} onChange={campo('nombre')} />
            </div>
            <div className="form-group">
              <label>Apellido</label>
              <input value={form.apellido} onChange={campo('apellido')} />
            </div>
            <div className="form-group">
              <label>Nacionalidad</label>
              <input value={form.nacionalidad ?? ''} onChange={campo('nacionalidad')} />
            </div>
            <div className="form-group">
              <label>Fecha de nacimiento</label>
              <input type="date" value={form.fechaNacimiento ?? ''} onChange={campo('fechaNacimiento')} />
            </div>
            <div className="form-group">
              <label>Fecha de fallecimiento (opcional)</label>
              <input type="date" value={form.fechaFallecimiento ?? ''} onChange={campo('fechaFallecimiento')} />
            </div>
            <div className="form-group col-span-2">
              <label>Biografia</label>
              <textarea value={form.biografia ?? ''} onChange={campo('biografia')} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
