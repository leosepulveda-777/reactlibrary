// Componente que muestra el estado de una entidad con color segun su valor.
// Mapea los estados del backend a una variante visual.

type BadgeVariant = 'success' | 'danger' | 'warn' | 'info' | 'muted';

const STATE_MAP: Record<string, BadgeVariant> = {
  ACTIVO:       'success',
  DISPONIBLE:   'success',
  PAGADA:       'success',
  COMPLETADA:   'success',
  DEVUELTO:     'info',
  DIGITAL:      'info',
  AMBOS:        'info',
  PENDIENTE:    'warn',
  EN_REPARACION:'warn',
  LISTA:        'warn',
  VENCIDO:      'danger',
  PRESTADO:     'danger',
  PERDIDO:      'danger',
  SUSPENDIDO:   'danger',
  CANCELADA:    'muted',
  EXPIRADA:     'muted',
  CONDONADA:    'muted',
  FISICO:       'muted',
};

interface BadgeProps {
  value: string;
}

export function Badge({ value }: BadgeProps) {
  const variant: BadgeVariant = STATE_MAP[value] ?? 'muted';
  return <span className={`badge badge-${variant}`}>{value}</span>;
}
