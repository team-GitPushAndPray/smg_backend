import { TipoChecklist } from '@prisma/client';

export interface ChecklistResumenResponse {
  normales: number;
  anormales: number;
  no_aplica: number;
}

export class CreatedChecklistResponseEntity {
  id: number;
  tipo: TipoChecklist;
  fecha: Date;
  equipo: string;
  horas_anteriores: number | null;
  horas_motor: number | null;
  resumen: ChecklistResumenResponse;
  fotos: string[];

  constructor(partial: CreatedChecklistResponseEntity) {
    Object.assign(this, partial);
  }
}