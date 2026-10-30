import { TipoChecklist } from '@prisma/client';

export interface PublicChecklistItemResponse {
  id: number;
  nombre: string;
}

export interface PublicChecklistOpcionResponse {
  tipo: TipoChecklist;
  titulo: string;
  items: PublicChecklistItemResponse[];
}

export interface PublicChecklistEquipoResponse {
  codigo_interno: string;
  categoria: string;
  marca: string | null;
  es_maquina: boolean;
  horas_motor_actual: number | null;
  horas_actualizadas_en: Date | null;
}

export class PublicChecklistResponseEntity {
  equipo: PublicChecklistEquipoResponse;
  opciones: PublicChecklistOpcionResponse[];

  constructor(data: {
    equipo: PublicChecklistEquipoResponse;
    opciones: PublicChecklistOpcionResponse[];
  }) {
    this.equipo = data.equipo;
    this.opciones = data.opciones;
  }
}