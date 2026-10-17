import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { META_MODULOS } from '../decorators/requiere-modulo.decorator.js';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { UsuarioAuthEntity } from '../entities/usuario-auth.entity.js';

@Injectable()
export class ModulosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic: boolean = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const modulosRequeridos: string[] = this.reflector.getAllAndOverride(
      META_MODULOS,
      [context.getHandler(), context.getClass()],
    );

    if (!modulosRequeridos || modulosRequeridos.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as UsuarioAuthEntity;

    if (!user || !Array.isArray(user.modulos)) {
      throw new ForbiddenException(
        'No tienes permisos para acceder a este módulo',
      );
    }

    const tienePermiso = modulosRequeridos.some((modulo: string) =>
      user.modulos.includes(modulo),
    );

    if (!tienePermiso) {
      throw new ForbiddenException(
        `Acceso denegado: se requiere permiso en el módulo [${modulosRequeridos.join(' o ')}]`,
      );
    }

    return true;
  }
}