// Tipos TypeScript que reflejan los DTOs del backend Spring Boot

// ---- Autenticacion -------------------------------------------------------

export type Rol = 'ADMIN' | 'BIBLIOTECARIO' | 'LECTOR';

// Usuario decodificado del JWT
export interface AuthUser {
  email: string;
  rol: Rol;
  userId?: number;       // viene como 'userId' en el JWT
  lectorId?: number;     // no viene en el JWT, se obtiene del backend
  nombre?: string;
  numeroCarnet?: string; // viene en el JWT
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  direccion: string;
  fechaNacimiento: string;
  password: string;
}

// ---- Catalogo ------------------------------------------------------------

export interface AutorResponse {
  id: number;
  nombre: string;
  apellido: string;
  nacionalidad?: string;
  fechaNacimiento?: string;
  fechaFallecimiento?: string;
  biografia?: string;
}

export interface AutorRequest {
  nombre: string;
  apellido: string;
  nacionalidad?: string;
  fechaNacimiento?: string;
  fechaFallecimiento?: string;
  biografia?: string;
}

export interface CategoriaResponse {
  id: number;
  nombre: string;
  descripcion?: string;
  activa: boolean;
  categoriaPadreId?: number;
  // El backend puede retornar hijos de distintas formas
  hijos?: CategoriaResponse[];
  subcategorias?: CategoriaResponse[];
}

export interface CategoriaRequest {
  nombre: string;
  descripcion?: string;
  categoriaPadreId?: number | null;
}

export type TipoLibro = 'FISICO' | 'DIGITAL' | 'AMBOS';

export interface LibroDigitalResponse {
  id: number;
  formato: string;
  tamanioMb: number;
  urlDescarga?: string;
}

export interface LibroResponse {
  id: number;
  isbn: string;
  titulo: string;
  editorial?: string;
  anioPublicacion?: number;
  sinopsis?: string;
  imagenUrl?: string;
  tipo: TipoLibro;
  activo: boolean;
  autores?: AutorResponse[];
  categorias?: CategoriaResponse[];
  digitales?: LibroDigitalResponse[];
  ejemplaresDisponibles?: number;
}

export interface LibroRequest {
  isbn: string;
  titulo: string;
  editorial?: string;
  anioPublicacion?: number;
  sinopsis?: string;
  imagenUrl?: string;
  tipo: TipoLibro;
  autorIds?: number[];
  categoriaIds?: number[];
}

export type EstadoEjemplar = 'DISPONIBLE' | 'PRESTADO' | 'EN_REPARACION' | 'PERDIDO';

export interface EjemplarResponse {
  id: number;
  libroId: number;
  codigoBarras: string;
  ubicacion?: string;
  estado: EstadoEjemplar;
}

export interface EjemplarRequest {
  libroId: number;
  codigoBarras: string;
  ubicacion?: string;
  estado?: EstadoEjemplar;
}

export interface LibroDigitalRequest {
  libroId: number;
  urlDescarga: string;
  formato: string;
  tamanioMb: number;
}

// ---- Lectores ------------------------------------------------------------

export type EstadoLector = 'ACTIVO' | 'SUSPENDIDO';

export interface LectorResponse {
  id: number;
  usuarioId: number;
  numeroCarnet: string;
  nombre: string;
  apellido: string;
  documento: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  estado: EstadoLector;
}

export interface LectorUpdateRequest {
  telefono?: string;
  direccion?: string;
  email?: string;
}

// ---- Prestamos -----------------------------------------------------------

export type TipoPrestamo  = 'FISICO' | 'DIGITAL';
export type EstadoPrestamo = 'ACTIVO' | 'DEVUELTO' | 'VENCIDO';

export interface PrestamoResponse {
  id: number;
  lectorId: number;
  nombreLector?: string;
  tituloLibro?: string;
  tipo: TipoPrestamo;
  fechaPrestamo: string;
  fechaDevolucionEsperada?: string;
  fechaDevolucionReal?: string;
  renovaciones: number;
  estado: EstadoPrestamo;
}

// ---- Reservas ------------------------------------------------------------

export type EstadoReserva = 'PENDIENTE' | 'LISTA' | 'COMPLETADA' | 'EXPIRADA' | 'CANCELADA';

export interface ReservaResponse {
  id: number;
  lectorId: number;
  libroId: number;
  tituloLibro?: string;
  fechaReserva: string;
  posicionCola: number;
  estado: EstadoReserva;
}

export interface ReservaRequest {
  libroId: number;
}

// ---- Multas --------------------------------------------------------------

export type EstadoMulta = 'PENDIENTE' | 'PAGADA' | 'CONDONADA';

export interface MultaResponse {
  id: number;
  prestamoId: number;
  monto: number;
  montoPagado: number;
  fechaGeneracion: string;
  estado: EstadoMulta;
  motivoCondonacion?: string;
}

export interface PagoMultaRequest {
  monto: number;
  metodoPago: string;
}

export interface CondonacionRequest {
  monto: number;
  motivo: string;
}

// ---- Reportes ------------------------------------------------------------

export interface ReportePrestamosResponse {
  totalPrestamos: number;
  prestamosActivos: number;
  prestamosFisicos: number;
  prestamosDigitales: number;
  devolucionesATiempo: number;
  devolucionesTardias: number;
}

export interface ReporteMultasResponse {
  totalMultas: number;
  montoTotal: number;
  pagadas: number;
  pendientes: number;
  montoPendiente: number;
}

export interface ReporteInventarioResponse {
  totalLibros: number;
  totalEjemplares: number;
  ejemplaresDisponibles: number;
  ejemplaresPrestados: number;
  ejemplaresEnReparacion: number;
  ejemplaresPerdidos: number;
}

// ---- Paginacion generica -------------------------------------------------

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}
