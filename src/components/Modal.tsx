// Componente de dialogo modal reutilizable.
// Se cierra al hacer click fuera del contenido o en el boton X.

import { ReactNode } from 'react';

interface ModalProps {
  title: string;
  onClose: () => void;
  children: ReactNode;
  actions?: ReactNode;
}

export function Modal({ title, onClose, children, actions }: ModalProps) {
  // Cierra el modal solo si el click fue sobre el overlay, no sobre el contenido
  function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
    if (e.target === e.currentTarget) onClose();
  }

  return (
    <div className="modal-overlay" onClick={handleOverlayClick}>
      <div className="modal">
        {/* Encabezado con titulo y boton de cierre */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">{title}</h3>
          <button
            className="text-muted hover:text-white text-2xl leading-none bg-transparent border-none cursor-pointer"
            onClick={onClose}
          >
            x
          </button>
        </div>

        {/* Contenido del modal */}
        {children}

        {/* Botones de accion opcionales */}
        {actions && (
          <div className="flex gap-2.5 justify-end mt-6">{actions}</div>
        )}
      </div>
    </div>
  );
}
