import { TipoPlantilla } from '@prisma/client';

export interface PlantillaSeedConfig {
  tipo: TipoPlantilla;
  nombre: string;
  items: readonly string[];
}

// DRY: Única fuente de verdad para los 29 ítems de Diario y Mantenimiento
export const ITEMS_DIARIO_Y_MANTENIMIENTO: readonly string[] = [
  'Aceite de motor',
  'Aceite hidráulico',
  'Diferencial',
  'Transmisión',
  'Refrigerante',
  'Correa de distribución',
  'Correa de alternador',
  'Cubre correa',
  'Estado de batería',
  'Soporte de batería',
  'Fusilera',
  'Luces delanteras',
  'Luces traseras',
  'Luces de cabina',
  'Cilindro de vuelco',
  'Cilindro de levante',
  'Cilindro desplazador',
  'Cilindros bajo cabina',
  'Mangueras de vuelco',
  'Mangueras de levante',
  'Mangueras de dirección',
  'Mangueras del bobtach',
  'Pernos y seguros de cilindros',
  'Pernos y seguros de dirección',
  'Auxiliar hidráulico',
  'Pintura general',
  'Limpieza bajo cabina',
  'Limpieza de motor',
  'Pérdidas de fluidos',
];

// 23 ítems exclusivos de Alquileres (Entrega / Devolución)
export const ITEMS_ALQUILERES: readonly string[] = [
  'Estado de rodillo compactador',
  'Conexiones hidráulicas',
  'Estado de mangueras',
  'Tacos de vibración',
  'Motor hidráulico',
  'Filo de puntas de mecha',
  'Bulones y tuercas del equipo',
  'Filo de punteras / uñas',
  'Estado de cilindros hidráulicos',
  'Estado de cepillos',
  'Estado de lámina de corte',
  'Punta de impacto del martillo',
  'Pérdidas hidráulicas',
  'Engrasadores',
  'Palancas de mando',
  'Asiento',
  'Estado de pasadores',
  'Estado de balde',
  'Terminales de mangueras',
  'Anclaje del aditamento (bobtach)',
  'Pernos o pasadores',
  'Limpieza del equipo',
  'Prueba frente al cliente',
];

export const PLANTILLAS_CHECKLIST_SEED: readonly PlantillaSeedConfig[] = [
  {
    tipo: TipoPlantilla.DIARIO,
    nombre: 'Revisión diaria',
    items: ITEMS_DIARIO_Y_MANTENIMIENTO,
  },
  {
    tipo: TipoPlantilla.MANTENIMIENTO,
    nombre: 'Mantenimiento',
    items: ITEMS_DIARIO_Y_MANTENIMIENTO,
  },
  {
    tipo: TipoPlantilla.ALQUILERES,
    nombre: 'Entrega / Devolución',
    items: ITEMS_ALQUILERES,
  },
];