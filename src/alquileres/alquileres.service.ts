import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoAlquiler, EstadoEquipo, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAlquilerDto } from './dto/create-alquileres.dto.js';
import { GetAlquileresQueryDto } from './dto/get-alquileres-query.dto.js';

const DIAS_POR_VENCER = 7;

@Injectable()
export class AlquileresService {

  constructor(private readonly prisma: PrismaService) { }


  async findAll(query: GetAlquileresQueryDto) {
    const { estado, cliente_id, equipo_id, por_vencer } = query;
    const where: Prisma.AlquilerWhereInput = {};

    if (cliente_id) {
      where.cliente_id = cliente_id;
    }

    if (equipo_id) {
      where.equipos = {
        some: {
          equipo_id,
        },
      };
    }

    if (por_vencer) {
      const hoyMasDias = new Date();
      hoyMasDias.setDate(hoyMasDias.getDate() + DIAS_POR_VENCER);
      hoyMasDias.setHours(23, 59, 59, 999);

      where.estado = EstadoAlquiler.ACTIVO;
      where.fecha_fin_prevista = {
        lte: hoyMasDias,
      };
    } else if (estado && estado.length > 0) {
      where.estado = { in: estado };
    }

    const orderBy: Prisma.AlquilerOrderByWithRelationInput = por_vencer ? { fecha_fin_prevista: 'asc' } : { creado_en: 'desc' };

    const alquileres = await this.prisma.alquiler.findMany({
      where,
      orderBy,
      include: {
        cliente: {
          select: {
            id: true,
            razon_social: true,
          },
        },
        equipos: {
          include: {
            equipo: {
              select: {
                id: true,
                codigo_interno: true,
                categoria: {
                  select: {
                    id: true,
                    nombre: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return alquileres.map((alquiler) => {
      const entregados = alquiler.equipos.filter(
        (eq) => eq.checklist_entrega_id !== null,
      ).length;
      const devueltos = alquiler.equipos.filter(
        (eq) => eq.checklist_devolucion_id !== null,
      ).length;

      return {
        id: alquiler.id,
        estado: alquiler.estado,
        fecha_inicio: alquiler.fecha_inicio,
        fecha_fin_prevista: alquiler.fecha_fin_prevista,
        latitud: Number(alquiler.latitud),
        longitud: Number(alquiler.longitud),
        ubicacion_referencia: alquiler.ubicacion_referencia,
        cliente: alquiler.cliente,
        equipos: alquiler.equipos.map((ae) => ({
          id: ae.equipo.id,
          codigo_interno: ae.equipo.codigo_interno,
          categoria: ae.equipo.categoria?.nombre ?? null,
        })),
        entregados,
        devueltos,
      };
    });
  }


  async findOne(id: number) {
    const alquiler = await this.prisma.alquiler.findUnique({
      where: { id },
      include: {
        cliente: true,
        usuario: {
          select: {
            nombre: true,
            apellido: true,
          },
        },
        equipos: {
          include: {
            equipo: {
              include: {
                categoria: {
                  select: {
                    nombre: true,
                  },
                },
                maquina: {
                  select: { equipo_id: true },
                },
                aditamento: {
                  select: { equipo_id: true },
                },
              },
            },
            checklist_entrega: {
              select: {
                id: true,
                fecha: true,
                responsable_nombre: true,
                responsable_apellido: true,
                horas_motor: true,
              },
            },
            checklist_devolucion: {
              select: {
                id: true,
                fecha: true,
                responsable_nombre: true,
                responsable_apellido: true,
                horas_motor: true,
              },
            },
          },
        },
      },
    });

    if (!alquiler) throw new NotFoundException(`Alquiler con ID ${id} no encontrado`);

    return {
      id: alquiler.id,
      estado: alquiler.estado,
      fecha_inicio: alquiler.fecha_inicio,
      fecha_fin_prevista: alquiler.fecha_fin_prevista,
      latitud: Number(alquiler.latitud),
      longitud: Number(alquiler.longitud),
      ubicacion_referencia: alquiler.ubicacion_referencia,
      contacto_obra_nombre: alquiler.contacto_obra_nombre,
      contacto_obra_telefono: alquiler.contacto_obra_telefono,
      observaciones: alquiler.observaciones,
      motivo_anulacion: alquiler.motivo_anulacion,
      creado_en: alquiler.creado_en,
      actualizado_en: alquiler.actualizado_en,
      cliente: alquiler.cliente,
      creado_por: {
        nombre: alquiler.usuario.nombre,
        apellido: alquiler.usuario.apellido,
      },
      equipos: alquiler.equipos.map((ae) => {
        const esMaquina = ae.equipo.maquina !== null;
        const tipo = esMaquina ? 'MAQUINA' : 'ADITAMENTO';

        return {
          id: ae.equipo.id,
          codigo_interno: ae.equipo.codigo_interno,
          categoria: ae.equipo.categoria?.nombre ?? null,
          marca: ae.equipo.marca,
          tipo,
          entrega: ae.checklist_entrega
            ? {
              checklist_id: ae.checklist_entrega.id,
              fecha: ae.checklist_entrega.fecha,
              responsable_nombre: ae.checklist_entrega.responsable_nombre,
              responsable_apellido: ae.checklist_entrega.responsable_apellido,
              horas_motor: ae.checklist_entrega.horas_motor,
            }
            : null,
          devolucion: ae.checklist_devolucion
            ? {
              checklist_id: ae.checklist_devolucion.id,
              fecha: ae.checklist_devolucion.fecha,
              responsable_nombre: ae.checklist_devolucion.responsable_nombre,
              responsable_apellido: ae.checklist_devolucion.responsable_apellido,
              horas_motor: ae.checklist_devolucion.horas_motor,
            }
            : null,
        };
      }),
    };
  }


  async create(dto: CreateAlquilerDto, usuarioId: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dto.cliente_id },
    });

    if (!cliente) throw new NotFoundException(`Cliente con ID ${dto.cliente_id} no encontrado`);

    if (!cliente.activo) throw new ConflictException(`El cliente "${cliente.razon_social}" se encuentra inactivo y no puede registrar alquileres`);


    const equipos = await this.prisma.equipo.findMany({
      where: { id: { in: dto.equipo_ids } },
      select: {
        id: true,
        codigo_interno: true,
        activo: true,
        estado: true,
      },
    });

    if (equipos.length !== dto.equipo_ids.length) {
      const encontradosIds = new Set(equipos.map((e) => e.id));
      const faltantes = dto.equipo_ids.filter((id) => !encontradosIds.has(id));
      throw new ConflictException(
        `Los siguientes IDs de equipo no existen: ${faltantes.join(', ')}`,
      );
    }

    const noDisponibles = equipos.filter(
      (e) => !e.activo || e.estado !== EstadoEquipo.disponible,
    );

    if (noDisponibles.length > 0) {
      const codigos = noDisponibles.map((e) => e.codigo_interno).join(', ');
      throw new ConflictException(`Los siguientes equipos no están disponibles para alquilar: ${codigos}`);
    }


    const alquiler = await this.prisma.$transaction(async (tx) => {

      const nuevoAlquiler = await tx.alquiler.create({
        data: {
          cliente_id: dto.cliente_id,
          usuario_id: usuarioId,
          estado: EstadoAlquiler.PENDIENTE,
          fecha_inicio: new Date(dto.fecha_inicio),
          fecha_fin_prevista: new Date(dto.fecha_fin_prevista),
          latitud: dto.latitud,
          longitud: dto.longitud,
          ubicacion_referencia: dto.ubicacion_referencia,
          contacto_obra_nombre: dto.contacto_obra_nombre ?? null,
          contacto_obra_telefono: dto.contacto_obra_telefono ?? null,
          observaciones: dto.observaciones ?? null,
        },
      });

      await tx.alquilerEquipo.createMany({
        data: dto.equipo_ids.map((equipoId) => ({
          alquiler_id: nuevoAlquiler.id,
          equipo_id: equipoId,
        })),
      });

      const resultadoUpdate = await tx.equipo.updateMany({
        where: {
          id: { in: dto.equipo_ids },
          activo: true,
          estado: EstadoEquipo.disponible,
        },
        data: {
          estado: EstadoEquipo.alquilado,
        },
      });

      if (resultadoUpdate.count !== dto.equipo_ids.length) throw new ConflictException('Uno o más equipos dejaron de estar disponibles simultáneamente. Operación cancelada.');

      return tx.alquiler.findUniqueOrThrow({
        where: { id: nuevoAlquiler.id },
        include: {
          cliente: {
            select: {
              id: true,
              razon_social: true,
            },
          },
          equipos: {
            include: {
              equipo: true,
            },
          },
        },
      });
    });

    return {
      ...alquiler,
      latitud: Number(alquiler.latitud),
      longitud: Number(alquiler.longitud),
    };
  }

}