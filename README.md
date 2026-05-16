# frontedlibrary

Frontend del Sistema de Gestion de Biblioteca. Construido con React, TypeScript y Tailwind CSS.
Se conecta al backend Spring Boot en `http://localhost:8080`.

## Tecnologias

- React 18
- TypeScript 5
- Tailwind CSS 3
- Vite 5

## Requisitos

- Node.js 18 o superior
- npm 9 o superior
- Backend Spring Boot corriendo en el puerto 8080

## Instalacion y uso

```bash
# Instalar dependencias
npm install

# Iniciar en modo desarrollo
npm run dev
```

La aplicacion queda disponible en `http://localhost:5173`.

## Estructura del proyecto

```
src/
  api/
    client.ts          # Cliente HTTP con JWT automatico
  contexts/
    AuthContext.tsx    # Estado global de autenticacion
    ToastContext.tsx   # Notificaciones globales
  components/
    Badge.tsx          # Indicador de estado con color
    Modal.tsx          # Dialogo reutilizable
    Pagination.tsx     # Navegacion de paginas
    Sidebar.tsx        # Menu lateral con navegacion por rol
  pages/
    auth/
      LoginPage.tsx    # US-002: inicio de sesion
      RegisterPage.tsx # US-001: registro de lector
    lector/
      CatalogoPage.tsx      # US-009, US-010: busqueda de libros
      MisPrestamosPage.tsx  # US-015, US-013: mis prestamos y renovacion
      MisReservasPage.tsx   # US-016, US-017: mis reservas
      MisMultasPage.tsx     # US-022: mis multas
      MiPerfilPage.tsx      # US-024: mi perfil
    staff/
      GestionPrestamosPage.tsx # US-011, US-012, US-013, US-014
      GestionLectoresPage.tsx  # US-023
      GestionMultasPage.tsx    # US-019, US-020, US-021
      GestionReservasPage.tsx  # US-018
      ReportesPage.tsx         # US-025, US-026, US-027
    catalogo/
      LibrosPage.tsx      # US-006: CRUD libros
      AutoresPage.tsx     # US-005: CRUD autores
      CategoriasPage.tsx  # US-004: CRUD categorias
  types/
    index.ts           # Tipos TypeScript de todos los DTOs
  App.tsx              # Componente raiz y enrutamiento
  main.tsx             # Punto de entrada
```

## Roles y acceso

| Pagina                   | LECTOR | BIBLIOTECARIO | ADMIN |
|--------------------------|--------|---------------|-------|
| Catalogo de libros       | Si     | Si            | Si    |
| Mis prestamos            | Si     | No            | No    |
| Mis reservas             | Si     | No            | No    |
| Mis multas               | Si     | No            | No    |
| Mi perfil                | Si     | No            | No    |
| Gestion prestamos        | No     | Si            | Si    |
| Gestion lectores         | No     | Si            | Si    |
| Gestion multas           | No     | Si            | Si    |
| Gestion reservas         | No     | Si            | Si    |
| Reportes                 | No     | Si            | Si    |
| CRUD libros/autores/cats | No     | Si            | Si    |
| Condonar multas          | No     | No            | Si    |

## Notas

- El proxy de Vite redirige `/api` hacia `http://localhost:8080` en desarrollo.
- El JWT se guarda en `localStorage` y se adjunta automaticamente a cada peticion.
- Si el token expira, la sesion se cierra y se redirige al login.
