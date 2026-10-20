import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateRolDto } from './dto/create-rol.dto.js';
import { RolEntity } from './entities/rol.entity.js';
import { UpdateRolDto } from './dto/update-rol.dto.js';
import { UpdateRolModulosDto } from './dto/update-rol-modulos.dto.js';


@Injectable()
export class RolesService {


  constructor(private readonly prisma: PrismaService) {}


  async findAll(): Promise<RolEntity[]> {
    const roles = await this.prisma.rol.findMany({
      include: {
        modulos: {
          include: { modulo: true },
        },
      },
      orderBy: { id: 'asc' },
    });

    return roles.map((rol) => RolEntity.fromPrisma(rol));
  }


  async create(dto: CreateRolDto): Promise<RolEntity> {
    await this.verificarNombreUnico(dto.nombre);

    const nuevoRol = await this.prisma.rol.create({
      data: {
        nombre: dto.nombre.trim(),
        descripcion: dto.descripcion,
        es_sistema: false,
        activo: true,
      },
      include: {
        modulos: {
          include: { modulo: true },
        },
      },
    });

    return RolEntity.fromPrisma(nuevoRol);

  }


  async update(id: number, dto: UpdateRolDto): Promise<RolEntity> {
    const rolActual = await this.obtenerRolYValidarNoSistema(id);

    if (dto.nombre && dto.nombre.trim() !== rolActual.nombre) {
      await this.verificarNombreUnico(dto.nombre, id);
    }

    const rolActualizado = await this.prisma.rol.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.descripcion !== undefined && { descripcion: dto.descripcion }),
        ...(dto.activo !== undefined && { activo: dto.activo }),
      },
      include: {
        modulos: {
          include: { modulo: true },
        },
      },
    });

    return RolEntity.fromPrisma(rolActualizado);
  }


  async replaceModulos(id: number, dto: UpdateRolModulosDto): Promise<RolEntity> {
    await this.obtenerRolYValidarNoSistema(id);

    // 1. Extraer los códigos en mayúsculas
    const codigosSolicitados = dto.modulos.map((m) => m.codigo.trim().toUpperCase());

    // 2. Comprobar duplicados comparando la longitud original con el Set de strings
    const codigosUnicos = new Set(codigosSolicitados);
    if (codigosUnicos.size !== codigosSolicitados.length) {
      throw new BadRequestException('No se permiten códigos de módulo duplicados en la solicitud');
    }

    // 3. Verificar que todos los códigos existan en la tabla modulo
    const modulosEncontrados = await this.prisma.modulo.findMany({
      where: { codigo: { in: Array.from(codigosUnicos) } },
    });

    if (modulosEncontrados.length !== codigosUnicos.size) {
      const encontradosSet = new Set(modulosEncontrados.map((m) => m.codigo.toUpperCase()));
      const invalidos = codigosSolicitados.filter((c) => !encontradosSet.has(c));
      throw new BadRequestException(`Los siguientes códigos de módulo no existen: ${invalidos.join(', ')}`);
    }

    const mapaModulosBd = new Map(modulosEncontrados.map((m) => [m.codigo.toUpperCase(), m.id]));

    // 4. Reemplazo transaccional
    const rolActualizado = await this.prisma.rol.update({
      where: { id },
      data: {
        modulos: {
          deleteMany: {},
          create: dto.modulos.map((item) => ({
            puede_editar: item.puedeEditar,
            modulo: { connect: { id: mapaModulosBd.get(item.codigo.trim().toUpperCase())! } },
          })),
        },
      },
      include: {
        modulos: {
          include: { modulo: true },
        },
      },
    });

    return RolEntity.fromPrisma(rolActualizado);
  }


  // Métodos privados

  private async obtenerRolYValidarNoSistema(id: number) {
    const rol = await this.prisma.rol.findUnique({ where: { id }});

    if (!rol) throw new NotFoundException(`El rol con ID ${id} no fue encontrado`);
    if (rol.es_sistema) throw new BadRequestException('No se puede editar ni modificar módulos de un rol de sistema');

    return rol;
  }


  private async verificarNombreUnico(nombre: string, excludeId?: number) {
    const existente = await this.prisma.rol.findFirst({
      where: {
        nombre: { equals: nombre.trim(), mode: 'insensitive' },
        ...(excludeId && { NOT: { id: excludeId }}),
      },
    });

    if (existente) throw new ConflictException(`Ya existe un rol con el nombre "${nombre}"`);
  }
}
