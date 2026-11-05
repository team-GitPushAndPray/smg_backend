import { Injectable, NotFoundException } from '@nestjs/common';
import { EstadoItem, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { GetHistorialChecklistsQueryDto } from './dto/get-historial-checklists-query.dto.js';

@Injectable()
export class HistorialChecklistsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByEquipo(
    equipoId: number,
    query: GetHistorialChecklistsQueryDto,
  ) {
    const equipoExiste = await this.prisma.equipo.findUnique({
      where: { id: equipoId },
      select: { id: true },
    });

    if (!equipoExiste) {
      throw new NotFoundException('Equipo no encontrado');
    }

    const where = this.buildWhereClause(equipoId, query);

    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.checklist.count({ where }),
      this.prisma.checklist.findMany({
        where,
        orderBy: { fecha: 'desc' },
        skip,
        take: limit,
        select: {
          id: true,
          tipo: true,
          fecha: true,
          horas_motor: true,
          responsable_nombre: true,
          responsable_apellido: true,
          observaciones: true,
          _count: {
            select: {
              fotos: true,
              respuestas: {
                where: { estado: EstadoItem.ANORMAL },
              },
            },
          },
          respuestas: {
            where: {
              AND: [
                { observacion: { not: null } },
                { NOT: { observacion: '' } },
              ],
            },
            select: { id: true },
            take: 1,
          },
        },
      }),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      tipo: row.tipo,
      fecha: row.fecha,
      horas_motor: row.horas_motor,
      responsable_nombre: row.responsable_nombre,
      responsable_apellido: row.responsable_apellido,
      cantidad_anormales: row._count?.respuestas ?? 0,
      cantidad_fotos: row._count?.fotos ?? 0,
      tiene_observaciones:
        Boolean(row.observaciones && row.observaciones.trim().length > 0) ||
        Boolean(row.respuestas?.length),
    }));

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
      },
    };
  }

  async findOneByEquipo(equipoId: number, checklistId: number) {
    const checklist = await this.prisma.checklist.findFirst({
      where: {
        id: checklistId,
        equipo_id: equipoId,
      },
      select: {
        id: true,
        tipo: true,
        fecha: true,
        horas_motor: true,
        responsable_nombre: true,
        responsable_apellido: true,
        observaciones: true,
        respuestas: {
          orderBy: {
            plantilla_item: {
              orden: 'asc',
            },
          },
          select: {
            estado: true,
            observacion: true,
            plantilla_item: {
              select: {
                nombre: true,
                orden: true,
              },
            },
          },
        },
        fotos: {
          orderBy: { id: 'asc' },
          select: {
            id: true,
            url: true,
          },
        },
      },
    });

    if (!checklist) {
      throw new NotFoundException('Checklist no encontrado');
    }

    const cantidad_anormales = checklist.respuestas.filter(
      (r) => r.estado === EstadoItem.ANORMAL,
    ).length;

    const respuestas = checklist.respuestas.map((r) => ({
      item: r.plantilla_item.nombre,
      orden: r.plantilla_item.orden,
      estado: r.estado,
      observacion: r.observacion,
    }));

    return {
      id: checklist.id,
      tipo: checklist.tipo,
      fecha: checklist.fecha,
      horas_motor: checklist.horas_motor,
      responsable_nombre: checklist.responsable_nombre,
      responsable_apellido: checklist.responsable_apellido,
      observaciones: checklist.observaciones,
      cantidad_anormales,
      respuestas,
      fotos: checklist.fotos,
    };
  }

  private buildWhereClause(
    equipoId: number,
    query: GetHistorialChecklistsQueryDto,
  ): Prisma.ChecklistWhereInput {
    const andConditions: Prisma.ChecklistWhereInput[] = [
      { equipo_id: equipoId },
    ];

    if (query.tipo) {
      andConditions.push({ tipo: query.tipo });
    }

    if (query.desde || query.hasta) {
      const fechaFilter: Prisma.DateTimeFilter = {};

      if (query.desde) {
        fechaFilter.gte = new Date(`${query.desde}T00:00:00.000Z`);
      }
      if (query.hasta) {
        fechaFilter.lte = new Date(`${query.hasta}T23:59:59.999Z`);
      }

      andConditions.push({ fecha: fechaFilter });
    }

    if (query.responsable && query.responsable.trim().length > 0) {
      const palabras = query.responsable.trim().split(/\s+/);

      for (const palabra of palabras) {
        andConditions.push({
          OR: [
            {
              responsable_nombre: {
                contains: palabra,
                mode: 'insensitive',
              },
            },
            {
              responsable_apellido: {
                contains: palabra,
                mode: 'insensitive',
              },
            },
          ],
        });
      }
    }

    if (query.q && query.q.trim().length > 0) {
      const termino = query.q.trim();

      andConditions.push({
        OR: [
          {
            observaciones: {
              contains: termino,
              mode: 'insensitive',
            },
          },
          {
            respuestas: {
              some: {
                observacion: {
                  contains: termino,
                  mode: 'insensitive',
                },
              },
            },
          },
        ],
      });
    }

    return { AND: andConditions };
  }
}