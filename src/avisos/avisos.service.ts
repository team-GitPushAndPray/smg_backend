import { Injectable } from '@nestjs/common';
import { Prisma, TipoAviso } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AvisosService {

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Evalúa una máquina por su ID (equipo_id) y genera los avisos de SERVICIO y CERTIFICACION correspondientes sin duplicar registros existentes
   * Si el ID pertencece a un aditamento o a un equipo inactivo, no hace nada
   */

  async evaluarMaquina(
    maquinaId: number,
    txClient?: Prisma.TransactionClient,
  ): Promise<number> {
    const db = txClient ?? this.prisma;

    const maquina = await db.maquina.findUnique({
      where: { equipo_id: maquinaId },
      select: {
        equipo_id: true,
        horas_motor_actual: true,
        certificacion_vence_el: true,
        equipo: {
          select: { activo: true },
        },
      },
    });

    if(!maquina || !maquina.equipo.activo) return 0;
    let avisosCreados = 0;

    const escalones = await db.escalonServicio.findMany({
      orderBy: { horas_intervalo: 'asc' },
    });

    if (escalones.length > 0) {
      const base = escalones[0].horas_intervalo; // 250
      const hito = Math.floor(
        (maquina.horas_motor_actual + this.anticipacionHoras) / base,
      ) * base;

      if (hito > 0) {
        const escalonCorrespondiente = [...escalones]
          .sort((a,b) => b.horas_intervalo - a.horas_intervalo)
          .find((e) => hito % e.horas_intervalo === 0);

        if (escalonCorrespondiente) {
          const resultadoServicio = await db.aviso.createMany({
            data: [
              {
                maquina_id: maquina.equipo_id,
                tipo: TipoAviso.SERVICIO,
                hito_horas: hito,
                escalon_id: escalonCorrespondiente.id,
              },
            ],
            skipDuplicates: true,
          });
          avisosCreados += resultadoServicio.count;
        }
      }
    }

    if (maquina.certificacion_vence_el !== null) {
      const diasRestantes = this.calcularDiasRestantes(
        maquina.certificacion_vence_el,
      );

      if (diasRestantes <= this.anticipacionDias) {
        const resultadoCertificacion = await db.aviso.createMany({
          data: [
            {
              maquina_id: maquina.equipo_id,
              tipo: TipoAviso.CERTIFICACION,
              vence_el: maquina.certificacion_vence_el,
            },
          ],
          skipDuplicates: true,
        });
        avisosCreados += resultadoCertificacion.count;
      }
    }

    return avisosCreados;
  }

  /**
   * Evaluar todas las máquinas activas del sistema y ejecuta evaluarMaquina para cada una. Retorna los contadores para el cron diario
   */
  async evaluarTodasLasMaquinas(): Promise<{
    maquinas_evaluadas: number;
    avisos_creados: number;
  }> {
    const maquinasActivas = await this.prisma.maquina.findMany({
      where: {
        equipo: {
          activo: true,
        },
      },
      select: {
        equipo_id: true,
      },
    });

    let avisosCreadosTotal = 0;

    for (const maquina of maquinasActivas) {
      const creados = await this.evaluarMaquina(maquina.equipo_id);
      avisosCreadosTotal += creados;
    }

    return {
      maquinas_evaluadas: maquinasActivas.length,
      avisos_creados: avisosCreadosTotal,
    };
  }


  /**
   * Calcula la diferencia en días calendario (vence_el - hoy) en UTC para evitar desfases por zona horaria en columnas
  */

  private calcularDiasRestantes(fechaVencimiento: Date): number {
    const ahora = new Date();
    const hoyUtc = Date.UTC(
      ahora.getUTCFullYear(),
      ahora.getUTCMonth(),
      ahora.getUTCDate(),
    );
    const venceUtc = Date.UTC(
      fechaVencimiento.getUTCFullYear(),
      fechaVencimiento.getUTCMonth(),
      fechaVencimiento.getUTCDate(),
    );

    const msPorDia = 1000 * 60 * 60 * 24;
    return Math.round((venceUtc - hoyUtc) / msPorDia);
  }


  private get anticipacionHoras(): number {
    const val = Number(process.env.AVISO_ANTICIPACION_HORAS);
    return Number.isFinite(val) && val > 0 ? val : 50;
  }

  private get anticipacionDias(): number {
    const val = Number(process.env.AVISO_ANTICIPACION_DIAS);
    return Number.isFinite(val) && val > 0 ? val : 30;
  }

}