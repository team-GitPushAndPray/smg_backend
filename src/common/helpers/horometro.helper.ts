import {
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

export class HorometroHelper {
  /**
   * Valida que las nuevas horas sean obligatorias y >= a las registradas.
   */
  static validarNuevasHoras(
    horasNuevas: number | null | undefined,
    horasActuales: number,
  ): number {
    if (horasNuevas === undefined || horasNuevas === null) {
      throw new BadRequestException(
        'El campo horas_motor es obligatorio para máquinas',
      );
    }

    if (horasNuevas < horasActuales) {
      throw new BadRequestException(
        `Las horas no pueden ser menores a las registradas (${horasActuales})`,
      );
    }

    return horasNuevas;
  }

  /**
   * Actualiza las horas atómicamente verificando concurrencia (Optimistic Lock con lte).
   * Puede operar dentro de una transacción o directamente con prisma.
   */
  static async actualizarHorasConcurrenciaSegura(
    db: Prisma.TransactionClient,
    equipoId: number,
    horasNuevas: number,
  ): Promise<void> {
    const resultado = await db.maquina.updateMany({
      where: {
        equipo_id: equipoId,
        horas_motor_actual: { lte: horasNuevas },
      },
      data: {
        horas_motor_actual: horasNuevas,
        horas_actualizadas_en: new Date(),
      },
    });

    if (resultado.count === 0) {
      throw new ConflictException(
        'Las horas del equipo fueron actualizadas recientemente con un valor mayor. Por favor, recargue el formulario.',
      );
    }
  }
}