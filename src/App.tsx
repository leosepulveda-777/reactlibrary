// Componente raiz de la aplicacion.
// Gestiona la autenticacion y el enrutamiento por paginas usando estado local.

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Sidebar } from '@/components/Sidebar';

// Paginas de autenticacion
import { LoginPage }    from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Paginas del lector
import { CatalogoPage }      from '@/pages/lector/CatalogoPage';
import { MisPrestamosPage }  from '@/pages/lector/MisPrestamosPage';
import { MisReservasPage }   from '@/pages/lector/MisReservasPage';
import { MisMultasPage }     from '@/pages/lector/MisMultasPage';
import { MiPerfilPage }      from '@/pages/lector/MiPerfilPage';

// Paginas de gestion (bibliotecario y admin)
import { GestionPrestamosPage } from '@/pages/staff/GestionPrestamosPage';
import { GestionLectoresPage }  from '@/pages/staff/GestionLectoresPage';
import { GestionMultasPage }    from '@/pages/staff/GestionMultasPage';
import { GestionReservasPage }  from '@/pages/staff/GestionReservasPage';
import { ReportesPage }         from '@/pages/staff/ReportesPage';

// Paginas del catalogo (bibliotecario y admin)
import { LibrosPage }     from '@/pages/catalogo/LibrosPage';
import { AutoresPage }    from '@/pages/catalogo/AutoresPage';
import { CategoriasPage } from '@/pages/catalogo/CategoriasPage';

type PageKey = string;

// Pagina inicial segun el rol del usuario
function paginaInicial(rol?: string): PageKey {
  return rol === 'LECTOR' ? 'catalogo' : 'prestamos';
}

const PAGINAS: Record<PageKey, () => JSX.Element> = {
  'catalogo':       () => <CatalogoPage />,
  'mis-prestamos':  () => <MisPrestamosPage />,
  'mis-reservas':   () => <MisReservasPage />,
  'mis-multas':     () => <MisMultasPage />,
  'mi-perfil':      () => <MiPerfilPage />,
  'prestamos':      () => <GestionPrestamosPage />,
  'lectores':       () => <GestionLectoresPage />,
  'multas':         () => <GestionMultasPage />,
  'reservas':       () => <GestionReservasPage />,
  'reportes':       () => <ReportesPage />,
  'libros':         () => <LibrosPage />,
  'autores':        () => <AutoresPage />,
  'categorias':     () => <CategoriasPage />,
};

export function App() {
  const { user, loading } = useAuth();

  const [authVista, setAuthVista] = useState<'login' | 'register'>('login');
  const [page, setPage] = useState<PageKey>(() => paginaInicial(user?.rol));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen text-muted">
        Cargando...
      </div>
    );
  }

  if (!user) {
    return authVista === 'login'
      ? <LoginPage    onSwitch={() => setAuthVista('register')} />
      : <RegisterPage onSwitch={() => setAuthVista('login')} />;
  }




  
  const Pagina = PAGINAS[page];

  return (
    <div className="flex min-h-screen">
      <Sidebar page={page} setPage={setPage} />
      <main className="ml-60 flex-1 p-8 min-h-screen">
        {Pagina ? <Pagina /> : (
          <div className="text-center py-20 text-muted">
            Selecciona una seccion del menu lateral
          </div>
        )}
      </main>
    </div>
  );
}

