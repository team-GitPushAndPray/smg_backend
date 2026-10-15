import { Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { CreateVendedoresDto } from './dto/create-vendedores.dto.js';
import { UpdateVendedoresDto } from './dto/update-vendedores.dto.js';
import { CargoVendedor } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class VendedoresService {

  private readonly logger = new Logger('VendedoresService');

  private readonly ordenCargos: Record<CargoVendedor, number> = {
    [CargoVendedor.LOGISTICA]: 1,
    [CargoVendedor.VENTAS]: 2,
    [CargoVendedor.ALQUILERES]: 3,
    [CargoVendedor.REPUESTOS]: 4,
  };


  constructor(private readonly prisma: PrismaService) {}


  async create(CreateVendedoresDto: CreateVendedoresDto) {
    try {
      return await this.prisma.vendedor.create({
        data: CreateVendedoresDto,
      });
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error al crear el vendedor');
    }
  }


  // ENDPOINT PÚBLICO: Solo devuelve los activos y ordenados por cargo
  async findAllPublic() {
    const vendedores = await this.prisma.vendedor.findMany({
      where: { activo: true },
    });

    return vendedores.sort((a, b) => {
      return this.ordenCargos[a.cargo] - this.ordenCargos[b.cargo];
    });
  }


  // ENDPOINT PROTEGIDO: Devuelve todos (incluso inactivos) para el panel de admin
  async findAllAdmin() {
    return this.prisma.vendedor.findMany();
  }


  async findOne(id: number) {
    const vendedor = await this.prisma.vendedor.findUnique({
      where: { id },
    });

    if (!vendedor) throw new NotFoundException('Vendedor con ID ${id} no encontrado');
    return vendedor;
  }


  async update(id: number, updateVendedoresDto: UpdateVendedoresDto) {
    await this.findOne(id);

    try {
      return await this.prisma.vendedor.update({
        where: { id },
        data: updateVendedoresDto,
      })
    } catch (error) {
      this.logger.error(error);
      throw new InternalServerErrorException('Error al actualizar el vendedor');
    }
  }


  async remove(id: number) {
    await this.findOne(id);

    // Borrado Lógico
    return this.prisma.vendedor.update({
      where: { id },
      data: { activo: false },
    });
  }
}
