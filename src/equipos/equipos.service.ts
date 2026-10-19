import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { FiltrosEquiposDto } from './dto/filtro-equipos.dto.js';
import { EquipoListItemEntity, EquipoDetalleEntity, EquipoConRelacionesPrisma } from './entities/equipo.entity.js';
import { CreateEquipoDto, UpdateEquipoDto } from './dto/index.js';


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

  // MÉTODOS PRIVADOS de lectura

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


  // 3. REGLAS DE DOMINIO PRIVADAS (SRP / DRY para Alta y Edición)

  /** Verifica que el codigo_interno no exista (insensible a mayúsculas) */ 
  private async validarCodigoInternoUnico(
    codigoInterno: string,
    excludeId?:number,
  ): Promise<void> {
    const existente = await this.prisma.equipo.findFirst({
      where: {
        codigo_interno: {
          equals: codigoInterno,
          mode: 'insensitive',
        },
        ...(excludeId !== undefined && { id: { not: excludeId }}),
      },
    });

    if (existente) throw new ConflictException(`Ya existe un equipo registrado con el código interno ${codigoInterno}`);
  }


  /** Verifica que la categoría exista en la base de datos. Sino, lanza 400 */
  private async validarCategoriaExiste(categoriaId: number): Promise<void> {
    const categoria = await this.prisma.categoria.findUnique({
      where: { id: categoriaId },
    });

    if (!categoria) throw new BadRequestException(`La categoría con ID ${categoriaId} no existe`);
  }

  /** Impide que un aditamento reciba campos exclusivos de máquina */
  private validarSinCamposDeMaquinaEnAditamento(campos: {
    modelo?: string;
    anio?: number;
    nSerie?: string;
    horasMotorActual?: number;
  }) : void {
    const tieneCamposMaquina = Object.values(campos).some(
      (valor) => valor !== undefined && valor !== null
    );

    if (tieneCamposMaquina) throw new BadRequestException('Un aditamento no puede incluir campos exclusivos de máquina (modelo, anio, nSerie, horasMotorActual');
  }

  // ALTA Y EDICIÓN DE EQUIPOS (POST Y PATCH)

  /** POST /api/equipos
   * Crea atómicamente el registro en 'equipos' y en su subtipo ('maquinas' o 'aditamentos')
   */

  async create(dto: CreateEquipoDto): Promise<EquipoDetalleEntity> {
    if (dto.tipo === 'aditamento') {
      this.validarSinCamposDeMaquinaEnAditamento({
        modelo: dto.modelo,
        anio: dto.anio,
        nSerie: dto.nSerie,
        horasMotorActual: dto.horasMotorActual,
      });
    }

    await this.validarCodigoInternoUnico(dto.codigoInterno);
    await this.validarCategoriaExiste(dto.categoriaId);

    const nuevoEquipo = await this.prisma.equipo.create({
      data: {
        codigo_interno: dto.codigoInterno,
        id_categoria: dto.categoriaId,
        marca: dto.marca,
        ubicacion: dto.ubicacion,
        descripcion: dto.descripcion,
        estado: 'disponible',
        activo: true,
        ...(dto.tipo === 'maquina'
          ? {
              maquina: {
                create: {
                  modelo: dto.modelo!,
                  anio: dto.anio!,
                  n_serie: dto.nSerie!,
                  horas_motor_actual: dto.horasMotorActual!,
                  horas_actualizadas_en: new Date(),
                },
              },
            }
          : {
              aditamento: {
                create: {},
              },
            }),
      },
      include: this.defaultInclude,
    });

    return new EquipoDetalleEntity(
      nuevoEquipo as unknown as EquipoConRelacionesPrisma,
    );
  }


  /**
   * PATCH /api/equipos/:id
   * Actualización parcial atómica de equipos y su subtipo
   */
  async update(id: number, dto: UpdateEquipoDto): Promise<EquipoDetalleEntity> {
    const equipoActual = await this.prisma.equipo.findUnique({
      where: { id },
      include: this.defaultInclude,
    });

    if (!equipoActual) throw new NotFoundException(`El equipo con ID $id no existe`);
    if (!equipoActual.activo) throw new ConflictException(`No se puede modificar el equipo con ID ${id} porque está dado de baja`);

    const esMaquina = Boolean(equipoActual.maquina);

    if (!esMaquina) {
      this.validarSinCamposDeMaquinaEnAditamento({
        modelo: dto.modelo,
        anio: dto.anio,
        nSerie: dto.nSerie,
      });
    }

    if (dto.codigoInterno !== undefined) {
      await this.validarCodigoInternoUnico(dto.codigoInterno, id);
    }

    if (dto.categoriaId !== undefined) {
      await this.validarCategoriaExiste(dto.categoriaId);
    }

    const tieneCambiosEnMaquina = 
      esMaquina && 
      (dto.modelo !== undefined || 
        dto.anio !== undefined || 
        dto.nSerie !== undefined
      );

    const equipoActualizado = await this.prisma.equipo.update({
      where: { id },
      data: {
        ...(dto.codigoInterno !== undefined && {
          codigo_interno: dto.codigoInterno,
        }),
        ...(dto.categoriaId !== undefined && {
          id_categoria: dto.categoriaId,
        }),
        ...(dto.marca !== undefined && { marca: dto.marca }),
        ...(dto.ubicacion !== undefined && { ubicacion: dto.ubicacion }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(tieneCambiosEnMaquina && {
          maquina: {
            update: {
              ...(dto.modelo !== undefined && { modelo: dto.modelo }),
              ...(dto.anio !== undefined && { anio: dto.anio }),
              ...(dto.nSerie !== undefined && { n_serie: dto.nSerie }),
            },
          },
        }),
      },
      include: this.defaultInclude,
    }); 

    return new EquipoDetalleEntity( equipoActualizado as unknown as EquipoConRelacionesPrisma);
  }

}
