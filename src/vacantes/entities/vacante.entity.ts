import { Prisma, Vacante } from '@prisma/client';

export const vacantePublicaSelect = {
  id: true,
  titulo: true,
  descripcion: true,
  requisitos: true,
} satisfies Prisma.VacanteSelect;

export const vacantePrivadaInclude = {
  _count: {
    select: { postulaciones: true },
  },
} satisfies Prisma.VacanteInclude;

export type VacantePublicaPrisma = {
  id: number;
  titulo: string;
  descripcion: string;
  requisitos: string;
};

export type VacantePrivadaPrisma = Vacante & {
  _count: {
    postulaciones: number;
  };
};

/**
 * GET /api/vacantes/publicas
 * Expone exclusivamente los campos requeridos por el portal público.
 */
export class VacantePublicaEntity {
  id: number;
  titulo: string;
  descripcion: string;
  requisitos: string;

  constructor(partial: VacantePublicaPrisma) {
    this.id = partial.id;
    this.titulo = partial.titulo;
    this.descripcion = partial.descripcion;
    this.requisitos = partial.requisitos;
  }
}

/**
 * endpoints administrativos (/api/vacantes)
 * Incluye estado de activación, auditoría y conteo de postulaciones.
 */
export class VacantePrivadaEntity extends VacantePublicaEntity {
  activa: boolean;
  cantidad_postulaciones: number;
  creado_en: Date;
  actualizado_en: Date;

  constructor(partial: VacantePrivadaPrisma) {
    super(partial);
    this.activa = partial.activa;
    this.cantidad_postulaciones = partial._count.postulaciones;
    this.creado_en = partial.creado_en;
    this.actualizado_en = partial.actualizado_en;
  }
}