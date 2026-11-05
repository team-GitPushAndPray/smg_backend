import { AplicaA, TipoPlantilla } from '@prisma/client';

export interface PlantillaItemSeedConfig {
  nombre: string;
  activo?: boolean;
}

export type ItemSeed = string | PlantillaItemSeedConfig;

export interface PlantillaSeedConfig {
  tipo: TipoPlantilla;
  nombre: string;
  aplica_a: AplicaA | null;
  items: readonly ItemSeed[];
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

// Ítems para Alquiler — Máquina (incluye ítem administrativo 'Empresa' desactivado)
export const ITEMS_ALQUILER_MAQUINA: readonly ItemSeed[] = [
  { nombre: 'Empresa', activo: false },
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

// Ítems genéricos aprobados para Alquiler — Aditamento
export const ITEMS_ALQUILER_ADITAMENTO: readonly string[] = [
  'Estructura general / fisuras y soldaduras',
  'Pernos y bujes',
  'Mangueras y acoples hidráulicos',
  'Desgaste de dientes / cuchilla / puntas',
  'Sistema de enganche',
  'Limpieza',
];

export const PLANTILLAS_CHECKLIST_SEED: readonly PlantillaSeedConfig[] = [
  {
    tipo: TipoPlantilla.DIARIO,
    nombre: 'Revisión diaria',
    aplica_a: null,
    items: ITEMS_DIARIO_Y_MANTENIMIENTO,
  },
  {
    tipo: TipoPlantilla.MANTENIMIENTO,
    nombre: 'Mantenimiento',
    aplica_a: null,
    items: ITEMS_DIARIO_Y_MANTENIMIENTO,
  },
  {
    tipo: TipoPlantilla.ALQUILERES,
    nombre: 'Alquiler — Máquina',
    aplica_a: AplicaA.MAQUINA,
    items: ITEMS_ALQUILER_MAQUINA,
  },
  {
    tipo: TipoPlantilla.ALQUILERES,
    nombre: 'Alquiler — Aditamento',
    aplica_a: AplicaA.ADITAMENTO,
    items: ITEMS_ALQUILER_ADITAMENTO,
  },
];