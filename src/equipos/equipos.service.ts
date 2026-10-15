import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class EquiposService {

  constructor(private readonly prisma: PrismaService) {}

  async findOnePublic(id: number) {
    const equipo = await this.prisma.equipo.findUnique({
      where: { id },
      include: {
        categoria: true,
        maquina: true,
        aditamento: true,
      },
    });

    if (!equipo || !equipo.activo) throw new NotFoundException('El equipo con ID ${id} no fue encontrado o no está disponible');

    return equipo;
  }

}
