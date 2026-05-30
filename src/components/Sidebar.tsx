import { useAuth } from '@/contexts/AuthContext';
import type { Rol } from '@/types';

type PageKey = string;

interface NavItemDef {
  label: string;
  key: PageKey;
}

const LECTOR_ITEMS: NavItemDef[] = [
  { label: 'Catálogo',      key: 'catalogo'      },
  { label: 'Mis préstamos', key: 'mis-prestamos' },
  { label: 'Mis reservas',  key: 'mis-reservas'  },
  { label: 'Mis multas',    key: 'mis-multas'    },
  { label: 'Mi perfil',     key: 'mi-perfil'     },
];

const STAFF_ITEMS: NavItemDef[] = [
  { label: 'Préstamos',  key: 'prestamos' },
  { label: 'Lectores',   key: 'lectores'  },
  { label: 'Multas',     key: 'multas'    },
  { label: 'Reservas',   key: 'reservas'  },
  { label: 'Reportes',   key: 'reportes'  },
];

const CATALOGO_ITEMS: NavItemDef[] = [
  { label: 'Libros',      key: 'libros'     },
  { label: 'Autores',     key: 'autores'    },
  { label: 'Categorías',  key: 'categorias' },
];

// Páginas permitidas por rol — el lector nunca puede ver páginas de staff
const PAGINAS_PERMITIDAS: Record<Rol, string[]> = {
  LECTOR: ['catalogo', 'mis-prestamos', 'mis-reservas', 'mis-multas', 'mi-perfil'],
  BIBLIOTECARIO: ['prestamos', 'lectores', 'multas', 'reservas', 'reportes', 'libros', 'autores', 'categorias', 'catalogo'],
  ADMIN: ['prestamos', 'lectores', 'multas', 'reservas', 'reportes', 'libros', 'autores', 'categorias', 'catalogo'],
};

interface SidebarProps {
  page: PageKey;
  setPage: (p: PageKey) => void;
}

export function Sidebar({ page, setPage }: SidebarProps) {
  const { user, logout } = useAuth();
  const rol: Rol  = user?.rol ?? 'LECTOR';
  const nombre    = user?.nombre ?? user?.email?.split('@')[0] ?? 'Usuario';
  const inicial   = nombre[0]?.toUpperCase() ?? 'U';

  // Protección: si la página actual no está permitida para el rol, redirigir
  const permitidas = PAGINAS_PERMITIDAS[rol] ?? [];
  const paginaActual = permitidas.includes(page) ? page : permitidas[0];

  function NavItem({ label, k }: { label: string; k: PageKey }) {
    return (
      <div
        className={`nav-item ${paginaActual === k ? 'active' : ''}`}
        onClick={() => setPage(k)}
      >
        {label}
      </div>
    );
  }

  function Section({ label }: { label: string }) {
    return (
      <div className="px-6 pt-4 pb-1.5 text-[10px] tracking-[1.5px] uppercase text-muted select-none">
        {label}
      </div>
    );
  }

  return (
    <aside className="w-60 bg-surface border-r border-border flex flex-col fixed top-0 left-0 h-screen overflow-y-auto z-50">
      <div className="px-6 py-6 border-b border-border">
        <h1 className="font-display text-2xl text-accent">BiblioSystem</h1>
        <span className="text-[11px] text-muted tracking-widest uppercase">
          Sistema de Biblioteca
        </span>
      </div>

      <nav className="flex-1 py-4">
        {rol === 'LECTOR' && (
          <>
            <Section label="Mi espacio" />
            {LECTOR_ITEMS.map(i => <NavItem key={i.key} label={i.label} k={i.key} />)}
          </>
        )}

        {(rol === 'BIBLIOTECARIO' || rol === 'ADMIN') && (
          <>
            <Section label="Gestión" />
            {STAFF_ITEMS.map(i => <NavItem key={i.key} label={i.label} k={i.key} />)}

            <Section label="Catálogo" />
            {CATALOGO_ITEMS.map(i => <NavItem key={i.key} label={i.label} k={i.key} />)}

            <Section label="Búsqueda" />
            <NavItem label="Catálogo público" k="catalogo" />
          </>
        )}
      </nav>

      <div className="px-6 py-4 border-t border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center font-bold text-sm text-black flex-shrink-0">
            {inicial}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold truncate">{nombre}</div>
            <div className="text-[11px] text-muted">{rol}</div>
          </div>
          <button
            className="text-muted hover:text-red-400 bg-transparent border-none cursor-pointer text-lg"
            onClick={logout}
            title="Cerrar sesión"
          >
            salir
          </button>
        </div>
      </div>
    </aside>
  );
}