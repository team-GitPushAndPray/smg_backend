import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { FiltroCatalogoDto } from './dto/filtro-catalogo.dto.js';

@Injectable()
export class CatalogoService {
  constructor(private prisma: PrismaService) {}

  async findAll(filtros: FiltroCatalogoDto) {
    const { categoriaId } = filtros;

    return this.prisma.equipo.findMany({
      where: {
        estado: 'disponible',
        activo: true,
        ...(categoriaId && { id_categoria: categoriaId }),
      },
      include: {
        categoria: true,
        maquina: true,
        aditamento: true,
      },
      orderBy: {
        id: 'desc', 
      }
    });
  }

  async findOne(id: number) {
    const equipo = await this.prisma.equipo.findFirst({
      where: {
        id: id,
        estado: 'disponible',
        activo: true,
      },
      include: {
        categoria: true,
        maquina: true,
        aditamento: true,
      },
    });

    if (!equipo) {
      throw new NotFoundException(
        `El equipo #${id} no existe o no se encuentra disponible en el catálogo en este momento.`,
      );
    }

    return equipo;
  }
}
