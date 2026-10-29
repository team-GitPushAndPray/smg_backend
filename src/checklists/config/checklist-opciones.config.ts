import { TipoChecklist, TipoPlantilla } from '@prisma/client';

export interface ConfiguracionOpcionChecklist {
  tipo: TipoChecklist;
  titulo: string;
  tipoPlantilla: TipoPlantilla;
}

/**
 * Vincula cada tipo de checklist operativo con su título de presentación y la plantilla física que utiliza.
 */
export const MAPA_OPCIONES_CHECKLIST: Record<TipoChecklist, ConfiguracionOpcionChecklist> = {
  [TipoChecklist.DIARIO]: {
    tipo: TipoChecklist.DIARIO,
    titulo: 'Revisión diaria',
    tipoPlantilla: TipoPlantilla.DIARIO,
  },
  [TipoChecklist.MANTENIMIENTO]: {
    tipo: TipoChecklist.MANTENIMIENTO,
    titulo: 'Mantenimiento',
    tipoPlantilla: TipoPlantilla.MANTENIMIENTO,
  },
  [TipoChecklist.ENTREGA]: {
    tipo: TipoChecklist.ENTREGA,
    titulo: 'Entrega',
    tipoPlantilla: TipoPlantilla.ALQUILERES,
  },
  [TipoChecklist.DEVOLUCION]: {
    tipo: TipoChecklist.DEVOLUCION,
    titulo: 'Devolución',
    tipoPlantilla: TipoPlantilla.ALQUILERES,
  },
};

/**
 * Orden estricto de opciones según el tipo de equipo.
 */
export const TIPOS_HABILITADOS_MAQUINA: readonly TipoChecklist[] = [
  TipoChecklist.DIARIO,
  TipoChecklist.MANTENIMIENTO,
  TipoChecklist.ENTREGA,
  TipoChecklist.DEVOLUCION,
];

export const TIPOS_HABILITADOS_ADITAMENTO: readonly TipoChecklist[] = [
  TipoChecklist.ENTREGA,
  TipoChecklist.DEVOLUCION,
];