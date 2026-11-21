import { ConflictException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { EstadoAviso, EstadoEnvio, EtapaNotificacion, Prisma, TipoAviso } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { NotificacionesService } from '../notificaciones/notificaciones.service.js';
import { FiltroAvisosDto } from './dto/filtro-avisos.dto.js';
import { AtenderAvisoDto } from './dto/atender-aviso.dto.js';
import { UpdateEscalonServicioDto } from './dto/update-escalon-servicio.dto.js';



// Definición estricta de las relaciones requeridas por el Contrato de la API
const avisoInclude = Prisma.validator<Prisma.AvisoDefaultArgs>()({
  include: {
    maquina: {
      include: {
        equipo: {
          select: {
            id: true,
            codigo_interno: true,
            marca: true,
          },
        },
      },
    },
    escalon: {
      select: {
        id: true,
        nombre: true,
        horas_intervalo: true,
      },
    },
    atendido_por: {
      select: {
        id: true,
        nombre: true,
        apellido: true,
      },
    },
  },
});

type AvisoConRelaciones = Prisma.AvisoGetPayload<typeof avisoInclude>;

@Injectable()
export class AvisosService {

  private readonly logger = new Logger(AvisosService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificacionesService: NotificacionesService,
  ) { }

  private get anticipacionHoras(): number {
    const val = Number(process.env.AVISO_ANTICIPACION_HORAS);
    return Number.isFinite(val) && val > 0 ? val : 50;
  }

  private get anticipacionDias(): number {
    const val = Number(process.env.AVISO_ANTICIPACION_DIAS);
    return Number.isFinite(val) && val > 0 ? val : 30;
  }


  // ENDPOINTS DE CONSULTA Y GESTIÓN

  /**
   * GET /api/avisos?estado=&tipo=
   * Lista los avisos aplicando filtros opcionales y calcula horas_restantes / dias_restantes
   */
  async findAll(filtros: FiltroAvisosDto) {
    const where: Prisma.AvisoWhereInput = {};

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    if (filtros.tipo) {
      where.tipo = filtros.tipo;
    }

    const avisos = await this.prisma.aviso.findMany({
      where,
      include: avisoInclude.include,
    });

    const avisosFormateados = avisos.map((aviso) => this.formatearAviso(aviso));

    return avisosFormateados.sort((a, b) => {
      if (a.estado !== b.estado) {
        return a.estado === EstadoAviso.PENDIENTE ? -1 : 1;
      }

      const restanteA =
        a.tipo === TipoAviso.SERVICIO ? a.horas_restantes! : a.dias_restantes!;
      const restanteB =
        b.tipo === TipoAviso.SERVICIO ? b.horas_restantes! : b.dias_restantes!;

      const vencidoA = restanteA <= 0;
      const vencidoB = restanteB <= 0;

      if (vencidoA !== vencidoB) {
        return vencidoA ? -1 : 1;
      }

      if (restanteA !== restanteB) {
        return restanteA - restanteB;
      }

      return b.id - a.id;
    });
  }

  /**
   * GET /api/avisos/resumen
   * Retorna el total de avisos pendientes y cuántos de ellos ya están vencidos.
   */
  async obtenerResumen(): Promise<{ pendientes: number; vencidos: number }> {
    const pendientes = await this.prisma.aviso.findMany({
      where: {
        estado: EstadoAviso.PENDIENTE,
      },
      include: {
        maquina: {
          select: {
            horas_motor_actual: true,
          },
        },
      },
    });

    let vencidos = 0;

    for (const aviso of pendientes) {
      if (aviso.tipo === TipoAviso.SERVICIO && aviso.hito_horas !== null) {
        const horasRestantes =
          aviso.hito_horas - aviso.maquina.horas_motor_actual;
        if (horasRestantes <= 0) {
          vencidos++;
        }
      } else if (
        aviso.tipo === TipoAviso.CERTIFICACION &&
        aviso.vence_el !== null
      ) {
        const diasRestantes = this.calcularDiasRestantes(aviso.vence_el);
        if (diasRestantes <= 0) {
          vencidos++;
        }
      }
    }

    return {
      pendientes: pendientes.length,
      vencidos,
    };
  }

  /**
   * PATCH /api/avisos/:id/atender
   * Marca un aviso como ATENDIDO y, si es de tipo SERVICIO, cierra en cascada todos los avisos SERVICIO pendientes de la misma máquina con hito_horas menor.
   */
  async atender(id: number, dto: AtenderAvisoDto, usuarioId: number) {
    const avisoExistente = await this.prisma.aviso.findUnique({
      where: { id },
    });

    if (!avisoExistente) {
      throw new NotFoundException(`El aviso con ID ${id} no existe`);
    }

    if (avisoExistente.estado === EstadoAviso.ATENDIDO) {
      throw new ConflictException(`El aviso con ID ${id} ya fue atendido`);
    }

    const ahora = new Date();

    const avisoActualizado = await this.prisma.$transaction(async (tx) => {
      const actualizado = await tx.aviso.update({
        where: { id },
        data: {
          estado: EstadoAviso.ATENDIDO,
          nota_atencion: dto.nota,
          atendido_por_id: usuarioId,
          atendido_en: ahora,
        },
        include: avisoInclude.include,
      });

      if (
        avisoExistente.tipo === TipoAviso.SERVICIO &&
        avisoExistente.hito_horas !== null
      ) {
        await tx.aviso.updateMany({
          where: {
            maquina_id: avisoExistente.maquina_id,
            tipo: TipoAviso.SERVICIO,
            estado: EstadoAviso.PENDIENTE,
            hito_horas: {
              lt: avisoExistente.hito_horas,
            },
          },
          data: {
            estado: EstadoAviso.ATENDIDO,
            nota_atencion: `Cerrado por el service de ${avisoExistente.hito_horas} hs`,
            atendido_por_id: usuarioId,
            atendido_en: ahora,
          },
        });
      }

      return actualizado;
    });

    return this.formatearAviso(avisoActualizado);
  }

  /**
   * Transforma el registro de Prisma a la estructura del Contrato de la API
   */
  private formatearAviso(aviso: AvisoConRelaciones) {
    const esServicio = aviso.tipo === TipoAviso.SERVICIO;
    const esCertificacion = aviso.tipo === TipoAviso.CERTIFICACION;

    const horasRestantes =
      esServicio && aviso.hito_horas !== null
        ? aviso.hito_horas - aviso.maquina.horas_motor_actual
        : null;

    const diasRestantes =
      esCertificacion && aviso.vence_el !== null
        ? this.calcularDiasRestantes(aviso.vence_el)
        : null;

    return {
      id: aviso.id,
      tipo: aviso.tipo,
      estado: aviso.estado,
      maquina: {
        id: aviso.maquina.equipo.id,
        codigo_interno: aviso.maquina.equipo.codigo_interno,
        marca: aviso.maquina.equipo.marca,
        modelo: aviso.maquina.modelo,
        horas_motor_actual: aviso.maquina.horas_motor_actual,
      },
      escalon: aviso.escalon
        ? {
          id: aviso.escalon.id,
          nombre: aviso.escalon.nombre,
          horas_intervalo: aviso.escalon.horas_intervalo,
        }
        : null,
      hito_horas: aviso.hito_horas,
      horas_restantes: horasRestantes,
      vence_el: aviso.vence_el,
      dias_restantes: diasRestantes,
      nota_atencion: aviso.nota_atencion,
      atendido_por: aviso.atendido_por
        ? {
          id: aviso.atendido_por.id,
          nombre: aviso.atendido_por.nombre,
          apellido: aviso.atendido_por.apellido,
        }
        : null,
      atendido_en: aviso.atendido_en,
      creado_en: aviso.creado_en,
    };
  }


  // MOTOR DE EVALUACIÓN AUTOMÁTICA

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

    if (!maquina || !maquina.equipo.activo) {
      return 0;
    }

    let avisosCreados = 0;

    const escalones = await db.escalonServicio.findMany({
      orderBy: { horas_intervalo: 'asc' },
    });

    if (escalones.length > 0) {
      const base = escalones[0].horas_intervalo;
      const hito =
        Math.floor(
          (maquina.horas_motor_actual + this.anticipacionHoras) / base,
        ) * base;

      if (hito > 0) {
        const escalonCorrespondiente = [...escalones]
          .sort((a, b) => b.horas_intervalo - a.horas_intervalo)
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


  // TIPOS DE SERVICE - ESCALONES

  /**
   * GET /api/escalones-servicio
   * Devuelve los 3 tipos de service ordenados por horas_intervalo ascendente.
   */
  async listarEscalones() {
    return this.prisma.escalonServicio.findMany({
      orderBy: { horas_intervalo: 'asc' },
    });
  }

  /**
   * PATCH /api/escalones-servicio/:id
   * Actualiza únicamente la descripción del escalón de servicio horas_intervalo y nombre jamás se modifican.
   */
  async actualizarEscalon(id: number, dto: UpdateEscalonServicioDto) {
    const escalon = await this.prisma.escalonServicio.findUnique({
      where: { id },
    });

    if (!escalon) {
      throw new NotFoundException(`El escalón de servicio con ID ${id} no existe`);
    }

    return this.prisma.escalonServicio.update({
      where: { id },
      data: {
        descripcion: dto.descripcion,
      },
    });
  }


  /**
   * Cierra todos los avisos CERTIFICACION pendientes de una máquina cuando se modifica su fecha de certificación y re-evalúa la máquina con la nueva fecha.
   */
  async procesarCambioCertificacion(
    maquinaId: number,
    usuarioId: number,
    txClient?: Prisma.TransactionClient,
  ) {
    const db = txClient ?? this.prisma;

    await db.aviso.updateMany({
      where: {
        maquina_id: maquinaId,
        tipo: TipoAviso.CERTIFICACION,
        estado: EstadoAviso.PENDIENTE,
      },
      data: {
        estado: EstadoAviso.ATENDIDO,
        nota_atencion: 'Certificación renovada',
        atendido_por_id: usuarioId,
        atendido_en: new Date(),
      },
    });

    await this.evaluarMaquina(maquinaId, db);
  }


  /**
   * Evalúa los avisos PENDIENTE de una máquina y envía notificaciones por los canales configurados cuando nacen (PROXIMO) o vencen (VENCIDO)
   */
  async notificarPendientes(maquinaId: number): Promise<void> {
    try {
      const avisosPendientes = await this.prisma.aviso.findMany({
        where: {
          maquina_id: maquinaId,
          estado: EstadoAviso.PENDIENTE,
        },
        include: avisoInclude.include,
        orderBy: { id: 'asc' },
      });

      if (avisosPendientes.length === 0) {
        return;
      }

      for (const aviso of avisosPendientes) {
        const formateado = this.formatearAviso(aviso);
        const restantes =
          aviso.tipo === TipoAviso.SERVICIO
            ? formateado.horas_restantes
            : formateado.dias_restantes;

        if (restantes === null) {
          continue;
        }

        const ahora = new Date();
        let etapa: EtapaNotificacion | null = null;
        let whereMarca: Prisma.AvisoWhereInput | null = null;
        let dataMarca: Prisma.AvisoUpdateManyMutationInput | null = null;

        if (aviso.notificado_en === null && restantes > 0) {
          etapa = EtapaNotificacion.PROXIMO;
          whereMarca = {
            id: aviso.id,
            estado: EstadoAviso.PENDIENTE,
            notificado_en: null,
          };
          dataMarca = { notificado_en: ahora };
        } else if (aviso.notificado_en === null && restantes <= 0) {
          etapa = EtapaNotificacion.VENCIDO;
          whereMarca = {
            id: aviso.id,
            estado: EstadoAviso.PENDIENTE,
            notificado_en: null,
            notificado_vencido_en: null,
          };
          dataMarca = {
            notificado_en: ahora,
            notificado_vencido_en: ahora,
          };
        } else if (
          aviso.notificado_en !== null &&
          restantes <= 0 &&
          aviso.notificado_vencido_en === null
        ) {
          etapa = EtapaNotificacion.VENCIDO;
          whereMarca = {
            id: aviso.id,
            estado: EstadoAviso.PENDIENTE,
            notificado_vencido_en: null,
          };
          dataMarca = { notificado_vencido_en: ahora };
        }

        if (!etapa || !whereMarca || !dataMarca) {
          continue;
        }

        const marcado = await this.prisma.aviso.updateMany({
          where: whereMarca,
          data: dataMarca,
        });

        if (marcado.count === 0) {
          continue;
        }

        const reglas = await this.prisma.reglaNotificacion.findMany({
          where: {
            tipo_aviso: aviso.tipo,
            activo: true,
          },
          orderBy: { id: 'asc' },
        });

        if (reglas.length === 0) {
          continue;
        }

        const mensaje = this.armarMensajeNotificacion(
          formateado,
          etapa,
          restantes,
        );

        for (const regla of reglas) {
          let estadoEnvio: EstadoEnvio = EstadoEnvio.ENVIADO;
          let errorDetalle: string | null = null;

          try {
            const notificador = this.notificacionesService.obtener(regla.canal);
            await notificador.enviar(regla.destino, mensaje);
          } catch (error: any) {
            estadoEnvio = EstadoEnvio.ERROR;
            errorDetalle = error?.message || String(error);
            this.logger.error(
              `Error al enviar notificación (aviso #${aviso.id}, regla #${regla.id}, canal ${regla.canal}): ${errorDetalle}`,
            );
          }

          await this.prisma.notificacionEnviada.create({
            data: {
              aviso_id: aviso.id,
              regla_id: regla.id,
              etapa,
              canal: regla.canal,
              destino: regla.destino,
              mensaje,
              estado: estadoEnvio,
              error_detalle: errorDetalle,
            },
          });
        }
      }
    } catch (error: any) {
      this.logger.error(
        `Error inesperado en notificarPendientes(maquinaId=${maquinaId}): ${error?.message || error}`,
      );
    }
  }

  private armarMensajeNotificacion(
    aviso: ReturnType<AvisosService['formatearAviso']>,
    etapa: EtapaNotificacion,
    restantes: number,
  ): string {
    const nombreMaquina = [aviso.maquina.marca, aviso.maquina.modelo]
      .filter(Boolean)
      .join(' ');
    const etiquetaMaquina = [aviso.maquina.codigo_interno, nombreMaquina]
      .filter(Boolean)
      .join(' ');

    if (aviso.tipo === TipoAviso.SERVICIO) {
      const escalonNombre = aviso.escalon?.nombre ?? 'Service';

      if (etapa === EtapaNotificacion.PROXIMO) {
        return `⚠️ La máquina ${etiquetaMaquina} está próxima al service de ${aviso.hito_horas} horas (${escalonNombre}). Horas actuales: ${aviso.maquina.horas_motor_actual}. Faltan ${restantes} hs.`;
      }

      return `🔴 La máquina ${etiquetaMaquina} tiene vencido el service de ${aviso.hito_horas} horas (${escalonNombre}). Horas actuales: ${aviso.maquina.horas_motor_actual}.`;
    }

    const fechaStr = aviso.vence_el
      ? this.formatearFechaUtc(aviso.vence_el)
      : '';

    if (etapa === EtapaNotificacion.PROXIMO) {
      return `⚠️ La certificación de la máquina ${etiquetaMaquina} vence el ${fechaStr} (faltan ${restantes} días).`;
    }

    return `🔴 La máquina ${etiquetaMaquina} tiene la certificación vencida desde el ${fechaStr}.`;
  }

  private formatearFechaUtc(fecha: Date): string {
    const dia = String(fecha.getUTCDate()).padStart(2, '0');
    const mes = String(fecha.getUTCMonth() + 1).padStart(2, '0');
    const anio = fecha.getUTCFullYear();
    return `${dia}/${mes}/${anio}`;
  }

}