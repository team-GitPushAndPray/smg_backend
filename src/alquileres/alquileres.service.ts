import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EstadoAlquiler, EstadoEquipo } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateAlquilerDto } from './dto/create-alquileres.dto.js';

@Injectable()
export class AlquileresService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAlquilerDto, usuarioId: number) {
    const cliente = await this.prisma.cliente.findUnique({
      where: { id: dto.cliente_id },
    });

    if (!cliente) throw new NotFoundException(`Cliente con ID ${dto.cliente_id} no encontrado`);

    if (!cliente.activo) throw new ConflictException( `El cliente "${cliente.razon_social}" se encuentra inactivo y no puede registrar alquileres`);


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