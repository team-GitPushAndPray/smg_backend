import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateClienteDto } from './dto/create-cliente.dto.js';
import { UpdateClienteDto } from './dto/update-cliente.dto.js';
import { GetClientesQueryDto } from './dto/get-clientes-query.dto.js';

@Injectable()
export class ClientesService {

  constructor(private readonly prisma: PrismaService) { }


  async findAll(query: GetClientesQueryDto) {
    const { q, activo } = query;
    const where: Prisma.ClienteWhereInput = {};

    if (activo !== undefined) {
      where.activo = activo;
    }

    if (q) {
      where.OR = [
        { razon_social: { contains: q, mode: 'insensitive' } },
      ];
    }

    return this.prisma.cliente.findMany({
      where,
      orderBy: { razon_social: 'asc' },
    });
  }


  async findOne(id: number) {
    const cliente = await this.prisma.cliente.findUnique({

      where: { id },
      include: {
        _count: {
          select: { alquileres: true },
        },
      },
    });

    if (!cliente) throw new NotFoundException(`Cliente con id ${id} no encontrado`);

    return cliente;
  }


  async create(dto: CreateClienteDto) {
    if (dto.cuit) {
      const existeCuit = await this.prisma.cliente.findUnique({
        where: { cuit: dto.cuit },
      });

      if (existeCuit) throw new ConflictException(`Ya existe un cliente con el CUIT ${dto.cuit}`);
    }

    return this.prisma.cliente.create({
      data: {
        ...dto,
        activo: true,
      },
    });
  }

  async update(id: number, dto: UpdateClienteDto) {
    await this.findOne(id);

    if (dto.cuit) {
      const existeCuit = await this.prisma.cliente.findFirst({
        where: {
          cuit: dto.cuit,
          id: { not: id },
        },
      });

      if (existeCuit) {
        throw new ConflictException(`Ya existe otro cliente con el CUIT ${dto.cuit}`);
      }
    }

    return this.prisma.cliente.update({
      where: { id },
      data: dto,
    });
  }
}