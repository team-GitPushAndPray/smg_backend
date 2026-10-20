import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service.js';
import { LoginDto } from './dto/login.dto.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { UsuarioAuthEntity } from './entities/usuario-auth.entity.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUserById(userId: number): Promise<UsuarioAuthEntity> {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      omit: { password: true },
      include: {
        rol: {
          include: {
            modulos: {
              include: { modulo: true },
            },
          },
        },
      },
    });

    if (!usuario || !usuario.activo || !usuario.rol?.activo) {
      throw new UnauthorizedException('Usuario inactivo o no autorizado');
    }

    return new UsuarioAuthEntity(usuario);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(password, usuario.password);
    if (!passwordValida) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimo_acceso: new Date() },
    });

    const payload = { sub: usuario.id, email: usuario.email };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }

  async changePassword(userId: number, dto: ChangePasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado');
    }

    const coincideActual = await bcrypt.compare(
      dto.passwordActual,
      usuario.password,
    );

    if (!coincideActual) {
      throw new BadRequestException('La contraseña actual es incorrecta');
    }

    const nuevoHash = await bcrypt.hash(dto.passwordNueva, 10);

    await this.prisma.usuario.update({
      where: { id: userId },
      data: { password: nuevoHash },
    });
  }


  async getMe(userId: number) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: userId },
      include: {
        rol: {
          include: {
            modulos: {
              include: {
                modulo: true,
              },
            },
          },
        },
      },
    });

    if (!usuario) throw new UnauthorizedException('Usuario no encontrado');

    const esSuperAdmin = usuario.rol.nombre.toLowerCase() === 'superadmin';

    let modulos: { codigo: string, puedeEditar: boolean}[] = [];

    if (esSuperAdmin) {
      const todosLosMoudulos = await this.prisma.modulo.findMany({
        orderBy: { codigo: 'asc' },
      });

      modulos = todosLosMoudulos.map((m) => ({
        codigo: m.codigo.toUpperCase(),
        puedeEditar: true,
      }));
    } else {
      modulos = (usuario.rol.modulos ?? []).map((rm) => ({
        codigo: rm.modulo.codigo.toUpperCase(),
        puedeEditar: Boolean(rm.puede_editar),
      }));
    }

    return {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      rol: usuario.rol.nombre,
      modulos,
    };
  }

}