import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { UsuarioEntity } from './entities/usuario.entity.js';

@Injectable()
export class UsuariosService {

  constructor( private readonly prisma: PrismaService) {}


  async findAll(): Promise<UsuarioEntity[]> {
      const usuarios = await this.prisma.usuario.findMany({
        omit: { password: true },
        include: { rol: true },
        orderBy: { id: 'asc' },
      });

      return usuarios.map((usuario) => UsuarioEntity.fromPrisma(usuario));
  }


  async findOne(id: number): Promise<UsuarioEntity> {

    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
      omit: { password: true },
      include: { rol: true },
    });

    if (!usuario) throw new NotFoundException(`El usuario con ID ${id} no existe`);

    return UsuarioEntity.fromPrisma(usuario);
  }


  async create(dto: CreateUsuarioDto): Promise<UsuarioEntity> {
    await this.verificarEmailUnico(dto.email);
    await this.verificarRolExistente(dto.rolId);

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const nuevoUsuario = await this.prisma.usuario.create({
      data: {
        nombre: dto.nombre.trim(),
        apellido: dto.apellido.trim(),
        email: dto.email.toLowerCase().trim(),
        telefono: dto.telefono ?? null,
        password: hashedPassword,
        rol_id: dto.rolId,
        activo: true,
      },
      omit: { password: true },
      include: { rol: true },
    });

    return UsuarioEntity.fromPrisma(nuevoUsuario);
  }


  async update(id: number, dto: UpdateUsuarioDto): Promise<UsuarioEntity> {
    const usuarioActual = await this.findOne(id);

    if (dto.email && dto.email.toLowerCase().trim() !== usuarioActual.email) {
      await this.verificarEmailUnico(dto.email, id);
    }

    if (dto.rolId !== undefined) {
      await this.verificarRolExistente(dto.rolId);
    }

    const usuarioActualizado = await this.prisma.usuario.update({
      where: { id },
      data: {
        ...(dto.nombre !== undefined && { nombre: dto.nombre.trim() }),
        ...(dto.apellido !== undefined && { apellido: dto.apellido.trim() }),
        ...(dto.email !== undefined && { email: dto.email.toLowerCase().trim() }),
        ...(dto.telefono !== undefined && { telefono: dto.telefono }),
        ...(dto.rolId !== undefined && { rol_id: dto.rolId }),
      },
      omit: { password: true },
      include: { rol: true },
    });

    return UsuarioEntity.fromPrisma(usuarioActualizado);
  }


  async updateEstado(
    id: number,
    activo: boolean,
    usuarioLogueadoId: number,
  ) : Promise<UsuarioEntity> {
    await this.findOne(id);

    if (id === usuarioLogueadoId && !activo) throw new BadRequestException('No puedes darte de baja a ti mismo');

    const usuarioActualizado = await this.prisma.usuario.update({
      where: { id },
      data: { activo },
      omit: { password: true },
      include: { rol: true },
    });

    return UsuarioEntity.fromPrisma(usuarioActualizado);
  }


  // Métodos privados

  private async verificarEmailUnico(email: string, excludeId?: number) {
    const existente = await this.prisma.usuario.findFirst({
      where: {
        email: { equals: email.toLowerCase().trim(), mode: 'insensitive' },
        ...(excludeId && { NOT: { id: excludeId }}),
      },
    });

    if (existente) throw new ConflictException(`El email ${email} ya está registrado`);
  }


  private async verificarRolExistente(rolId: number) {
    const rol = await this.prisma.rol.findUnique({ where: { id: rolId }});

    if (!rol) throw new BadRequestException(`El rol con ID ${rolId} no existe`);
  }

}
