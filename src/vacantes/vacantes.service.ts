import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateVacanteDto, UpdateVacanteDto } from './dto/index.js';
import { VacantePrivadaEntity, vacantePrivadaInclude, VacantePublicaEntity, vacantePublicaSelect } from './entities/vacante.entity.js';

@Injectable()
export class VacantesService {

  constructor(private readonly prisma: PrismaService) {}

  /**
   * GET /api/vacantes/publicas
   * Devuelve únicamente las vacantes activas con id, título, descripción y requisitos
   */
  async findAllPublicas(): Promise<VacantePublicaEntity[]> {
    
    const vacantes = await this.prisma.vacante.findMany({
      where: { activa: true },
      select: vacantePublicaSelect,
      orderBy: { creado_en: 'desc'},
    });

    return vacantes.map((v) => new VacantePublicaEntity(v));
  }


  /**
   * GET /api/vacantes
   * Devuelve todas las vacantes (activas e inactivas) junto con la cantidad de postulaciones
   */
  async findAllPrivado(): Promise<VacantePrivadaEntity[]> {
    const vacantes = await this.prisma.vacante.findMany({
      include: vacantePrivadaInclude,
      orderBy: [{ activa: 'desc' }, { creado_en: 'desc' }],
    });

    return vacantes.map((v) => new VacantePrivadaEntity(v));
  }


  /**
   * POST /api/vacantes
   * Crea una nueva vacante en el sistema
   */
  async create(dto: CreateVacanteDto): Promise<VacantePrivadaEntity> {
    const nuevaVacante = await this.prisma.vacante.create({
      data: {
        titulo: dto.titulo,
        descripcion: dto.descripcion,
        requisitos: dto.requisitos,
        ...(dto.activa !== undefined && { activa: dto.activa }),
      },
      include: vacantePrivadaInclude,
    });

    return new VacantePrivadaEntity(nuevaVacante);
  }


  /**
   * PATCH /api/vacantes/:id
   * Actualiza parcialmente título, descripción, requisitos o estado activa
   */
  async update(id: number, dto: UpdateVacanteDto): Promise<VacantePrivadaEntity> {
    await this.obtenerVacanteOrThrow(id);

    const vacanteActualizada = await this.prisma.vacante.update({
      where: { id },
      data: {
        ...(dto.titulo !== undefined && { titulo: dto.titulo }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.requisitos !== undefined && { requisitos: dto.requisitos }),
        ...(dto.activa !== undefined && { activa: dto.activa }),
      },
      include: vacantePrivadaInclude,
    });

    return new VacantePrivadaEntity(vacanteActualizada);
  }


  // Método de validación de existencia
  async obtenerVacanteOrThrow(id: number) {
    const vacante = await this.prisma.vacante.findUnique({
      where: { id },
    });

    if (!vacante) throw new NotFoundException(`La vacante con ID ${id} no existe`);
    return vacante;
  }

}