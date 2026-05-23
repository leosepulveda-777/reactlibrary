export type Rol = 'ADMIN' | 'BIBLIOTECARIO' | 'LECTOR';

export interface AuthUser {
  email: string;
  rol: Rol;
  userId?: number;
  lectorId?: number;
  nombre?: string;
  numeroCarnet?: string;
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

export type EstadoLector = 'ACTIVO' | 'SUSPENDIDO';

export interface LectorResponse {
  id: number;
  usuarioId: number;
  numeroCarnet: string;
  nombre: string;
  apellido: string;
  documento?: string;
  email: string;
  telefono?: string;
  direccion?: string;
  fechaNacimiento?: string;
  fechaRegistro?: string;
  activo: boolean;
  maxPrestamos?: number;
  prestamosActivos?: number;
  multasPendientes?: number;
  estado?: EstadoLector;
}

export interface LectorUpdateRequest {
  telefono?: string;
  direccion?: string;
  email?: string;
}

export type TipoPrestamo   = 'FISICO' | 'DIGITAL';
export type EstadoPrestamo = 'ACTIVO' | 'DEVUELTO' | 'VENCIDO' | 'RENOVADO';

export interface PrestamoResponse {
  id: number;
  lectorId: number;
  nombreLector?: string;
  numeroCarnet?: string;
  libroId?: number;
  tituloLibro?: string;
  isbnLibro?: string;
  ejemplarId?: number;
  codigoEjemplar?: string;
  libroDigitalId?: number;
  fechaPrestamo: string;
  fechaDevolucionEsperada?: string;
  fechaDevolucionReal?: string;
  estado: EstadoPrestamo;
  numeroRenovaciones: number;
  esDigital: boolean;
  observaciones?: string;
  vencido?: boolean;
  diasRetraso?: number;
}

export type EstadoReserva = 'PENDIENTE' | 'DISPONIBLE' | 'COMPLETADA' | 'EXPIRADA' | 'CANCELADA';

export interface ReservaResponse {
  id: number;
  lectorId: number;
  nombreLector?: string;
  numeroCarnet?: string;
  libroId: number;
  tituloLibro?: string;
  fechaReserva: string;
  fechaDisponible?: string;
  fechaExpiracion?: string;
  posicionCola: number;
  estado: EstadoReserva;
  observaciones?: string;
}

export interface ReservaRequest {
  libroId: number;
}

export type EstadoMulta = 'PENDIENTE' | 'PARCIALMENTE_PAGADA' | 'PAGADA' | 'CONDONADA';

export interface PagoMultaResponse {
  id: number;
  multaId: number;
  monto: number;
  fechaPago: string;
  metodoPago: string;
  referenciaPago?: string;
  registradoPor?: string;
  observaciones?: string;
}

export interface MultaResponse {
  id: number;
  lectorId: number;
  nombreLector?: string;
  numeroCarnet?: string;
  prestamoId: number;
  tituloLibro?: string;
  monto: number;
  montoPagado: number;
  montoPendiente?: number;
  diasRetraso?: number;
  estado: EstadoMulta;
  fechaGeneracion: string;
  fechaPago?: string;
  motivoCondonacion?: string;
  pagos?: PagoMultaResponse[];
}

export interface PagoMultaRequest {
  monto: number;
  metodoPago: string;
}

export interface CondonacionRequest {
  motivoCondonacion: string;
}

export interface ReportePrestamosResponse {
  desde?: string;
  hasta?: string;
  totalPrestamos: number;
  prestamosActivos: number;
  prestamosVencidos: number;
  prestamosDevueltos: number;
  prestamosFisicos: number;
  prestamosDigitales: number;
  detalle?: PrestamoResponse[];
}

export interface ReporteMultasResponse {
  desde?: string;
  hasta?: string;
  totalMultas: number;
  multasPendientes: number;
  multasPagadas: number;
  multasCondonadas: number;
  montoTotal: number;
  montoCobrado: number;
  montoPendiente: number;
  detalle?: MultaResponse[];
}

export interface ReporteInventarioResponse {
  totalLibros: number;
  totalEjemplares: number;
  ejemplaresDisponibles: number;
  ejemplaresPrestados: number;
  ejemplaresEnMantenimiento: number;
  totalLibrosDigitales: number;
  librosMasPrestados?: LibroResponse[];
}

export interface Page<T> {
  content: T[];
  totalPages: number;
  totalElements: number;
  number: number;
  size: number;
}