import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { ModuloEntity } from './entities/modulo.entity.js';


@Injectable()
export class ModulosService {

  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<ModuloEntity[]> {
    const modulos = await this.prisma.modulo.findMany({
      orderBy: { id: 'asc' },
    });

    return modulos.map((modulo) => ModuloEntity.fromPrisma(modulo));
  }
}
