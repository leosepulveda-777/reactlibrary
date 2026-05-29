// Componente que muestra el estado de una entidad con color segun su valor.

type BadgeVariant = 'success' | 'danger' | 'warn' | 'info' | 'muted';

const STATE_MAP: Record<string, BadgeVariant> = {
  ACTIVO:        'success',
  DISPONIBLE:    'success',
  PAGADA:        'success',
  COMPLETADA:    'success',
  DEVUELTO:      'info',
  DIGITAL:       'info',
  AMBOS:         'info',
  PENDIENTE:     'warn',
  EN_REPARACION: 'warn',
  LISTA:         'warn',
  PARCIALMENTE_PAGADA: 'warn',
  VENCIDO:       'danger',
  PRESTADO:      'danger',
  PERDIDO:       'danger',
  SUSPENDIDO:    'danger',
  CANCELADA:     'danger',
  EXPIRADA:      'danger',
  CONDONADA:     'muted',
  FISICO:        'muted',
};

const STYLES: Record<BadgeVariant, React.CSSProperties> = {
  success: { background: 'rgba(34,197,94,0.15)',  color: '#4ade80' },
  danger:  { background: 'rgba(239,68,68,0.15)',  color: '#f87171' },
  warn:    { background: 'rgba(234,179,8,0.15)',  color: '#facc15' },
  info:    { background: 'rgba(96,165,250,0.15)', color: '#60a5fa' },
  muted:   { background: 'rgba(255,255,255,0.07)', color: '#9ca3af' },
};

const BASE: React.CSSProperties = {
  display: 'inline-block',
  padding: '2px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

interface BadgeProps {
  value: string;
}

export function Badge({ value }: BadgeProps) {
  const variant: BadgeVariant = STATE_MAP[value] ?? 'muted';
  return (
    <span style={{ ...BASE, ...STYLES[variant] }}>
      {value}
    </span>
  );
}