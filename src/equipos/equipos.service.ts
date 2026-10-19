import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { FiltrosEquiposDto } from './dto/filtro-equipos.dto.js';
import { EquipoListItemEntity, EquipoDetalleEntity, EquipoConRelacionesPrisma } from './entities/equipo.entity.js';


@Injectable()
export class EquiposService {

  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultInclude = {
    categoria: true,
    maquina: true,
    aditamento: true,
  } satisfies Prisma.EquipoInclude;


  // MÉTODOS PÚBLICOS (para catálogo)
  async findOneCatalogo(id: number) {
    const equipo = await this.prisma.equipo.findFirst({
      where: {
        id,
        activo: true,
        estado: 'disponible' as any,
      },
      include: this.defaultInclude,
    });

    if (!equipo) throw new NotFoundException(`El equipo con ID ${id} no fue encontrado o no está disponible`);

    return equipo;
  }

  async findManyCatalogo(
    extraWhere: Prisma.EquipoWhereInput = {}, 
    orderBy: Prisma.EquipoOrderByWithRelationInput = { id: 'desc' } // <-- Orden original de tu catálogo
  ) {
    return this.prisma.equipo.findMany({
      where: {
        ...extraWhere,
        activo: true,
        estado: 'disponible' as any,
      },
      include: this.defaultInclude,
      orderBy,
    });
  }

  // MÉTODOS PRIVADOS (para la vista administrativa "Máquinas")

  private buildWhereClause(filtros: FiltrosEquiposDto): Prisma.EquipoWhereInput {

    const { search, tipo, estado, categoriaId, activo = true } = filtros;

    const where: Prisma.EquipoWhereInput = { activo };

    if (estado) where.estado = estado as any;
    if (categoriaId) where.id_categoria = categoriaId;

    if (tipo === 'maquina') {
      where.maquina = { isNot: null };
    } else if (tipo === 'aditamento') {
      where.aditamento = { isNot: null};
    }

    if (search && search.trim() !== '') {
      const term = search.trim();
      where.OR = [
        { codigo_interno: { contains: term, mode: 'insensitive' } },
        { marca: { contains: term, mode: 'insensitive' } },
        { categoria: { nombre: { contains: term, mode: 'insensitive' } } },
        { maquina: { modelo: { contains: term, mode: 'insensitive' } } },
      ];
    }

    return where;
  }


  async findAllPrivado(filtros: FiltrosEquiposDto) {
    const page = filtros.page ?? 1;
    const limit = filtros.limit ?? 10;
    const skip = (page - 1) * limit;
    const where = this.buildWhereClause(filtros);

    const [equipos, total] = await this.prisma.$transaction([
      this.prisma.equipo.findMany({
        where,
        include: this.defaultInclude,
        orderBy: { codigo_interno: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.equipo.count({ where }),
    ]);

    return {
      data: equipos.map(
        (eq) => new EquipoListItemEntity(eq as unknown as EquipoConRelacionesPrisma)
      ),
      meta: { total, page, limit },
    };
  }


  async findOnePrivado(id: number): Promise<EquipoDetalleEntity> {

    const equipo = await this.prisma.equipo.findUnique({
      where: { id },
      include: this.defaultInclude,
    });

    if (!equipo) throw new NotFoundException(`El equipo con ID ${id} no existe`);

    return new EquipoDetalleEntity(equipo as unknown as EquipoConRelacionesPrisma);
  }


  async findAllCategorias() {
    return this.prisma.categoria.findMany({
      select: { id: true, nombre: true, descripcion: true },
      orderBy: { nombre: 'asc' },
    });
  }

}
