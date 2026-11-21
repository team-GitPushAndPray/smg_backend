import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CanalNotificacion, Prisma } from '@prisma/client';
import { isEmail } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service.js';
import { CrearReglaNotificacionDto } from './dto/crear-regla-notificacion.dto.js';
import { ActualizarReglaNotificacionDto } from './dto/actualizar-regla-notificacion.dto.js';
import { FiltroRegistroNotificacionesDto } from './dto/filtro-registro-notificaciones.dto.js';

@Injectable()
export class NotificacionesGestionService {
  constructor(private readonly prisma: PrismaService) {}

  async listarReglas() {
    return this.prisma.reglaNotificacion.findMany({
      orderBy: [{ tipo_aviso: 'asc' }, { etiqueta: 'asc' }],
    });
  }

  async crearRegla(dto: CrearReglaNotificacionDto) {
    this.validarDestinoSegunCanal(dto.canal, dto.destino);

    return this.prisma.reglaNotificacion.create({
      data: {
        tipo_aviso: dto.tipo_aviso,
        canal: dto.canal,
        destino: dto.destino,
        etiqueta: dto.etiqueta,
        activo: dto.activo ?? true,
      },
    });
  }

  async actualizarRegla(id: number, dto: ActualizarReglaNotificacionDto) {
    const reglaExistente = await this.prisma.reglaNotificacion.findUnique({
      where: { id },
    });

    if (!reglaExistente) {
      throw new NotFoundException(
        `La regla de notificación con ID ${id} no existe`,
      );
    }

    const canalFinal = dto.canal ?? reglaExistente.canal;
    const destinoFinal = dto.destino ?? reglaExistente.destino;

    this.validarDestinoSegunCanal(canalFinal, destinoFinal);

    return this.prisma.reglaNotificacion.update({
      where: { id },
      data: {
        ...(dto.tipo_aviso !== undefined && { tipo_aviso: dto.tipo_aviso }),
        ...(dto.canal !== undefined && { canal: dto.canal }),
        ...(dto.destino !== undefined && { destino: dto.destino }),
        ...(dto.etiqueta !== undefined && { etiqueta: dto.etiqueta }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
    });
  }

  async listarRegistro(filtros: FiltroRegistroNotificacionesDto) {
    const where: Prisma.NotificacionEnviadaWhereInput = {};

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    if (filtros.canal) {
      where.canal = filtros.canal;
    }

    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      this.prisma.notificacionEnviada.findMany({
        where,
        orderBy: [{ enviado_en: 'desc' }, { id: 'desc' }],
        skip,
        take: limit,
        include: {
          aviso: {
            select: {
              tipo: true,
              maquina: {
                select: {
                  modelo: true,
                  equipo: {
                    select: {
                      codigo_interno: true,
                      marca: true,
                    },
                  },
                },
              },
            },
          },
          regla: {
            select: {
              etiqueta: true,
            },
          },
        },
      }),
      this.prisma.notificacionEnviada.count({ where }),
    ]);

    const data = items.map((item) => {
      const nombreMaquina = [
        item.aviso.maquina.equipo.marca,
        item.aviso.maquina.modelo,
      ]
        .filter(Boolean)
        .join(' ');

      return {
        id: item.id,
        enviado_en: item.enviado_en,
        etapa: item.etapa,
        canal: item.canal,
        destino: item.destino,
        mensaje: item.mensaje,
        estado: item.estado,
        error_detalle: item.error_detalle,
        aviso: {
          tipo: item.aviso.tipo,
        },
        maquina: {
          codigo: item.aviso.maquina.equipo.codigo_interno,
          nombre: nombreMaquina,
        },
        regla_etiqueta: item.regla?.etiqueta ?? null,
      };
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  private validarDestinoSegunCanal(
    canal: CanalNotificacion,
    destino: string,
  ): void {
    if (canal === CanalNotificacion.EMAIL) {
      if (!isEmail(destino)) {
        throw new BadRequestException(
          'Para el canal EMAIL, el destino debe ser una dirección de correo válida',
        );
      }
      return;
    }

    if (canal === CanalNotificacion.TELEGRAM) {
      if (!/^-?\d+$/.test(destino)) {
        throw new BadRequestException(
          'Para el canal TELEGRAM, el destino debe ser un número entero (puede ser negativo)',
        );
      }
      return;
    }

    throw new BadRequestException('Canal de notificación no soportado');
  }
}