import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import { MODULO_KEY, ModuloMetadata } from '../decorators/modulo.decorator.js';
import { UsuarioAuthEntity } from '../entities/usuario-auth.entity.js';

@Injectable()
export class ModulosGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic: boolean = this.reflector.getAllAndOverride(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    const requisito = this.reflector.getAllAndOverride<ModuloMetadata>(MODULO_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requisito) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user as UsuarioAuthEntity;

    if (!user) throw new ForbiddenException('Usuario no autenticado');

    if (user.rol?.nombre === 'superAdmin') return true;


    if (!Array.isArray(user.modulos)) throw new ForbiddenException('No tienes permisos asignados');

    const moduloAsignado = user.modulos.find(
      (m) => m.codigo === requisito.codigo
    );

    if (!moduloAsignado) {
      throw new ForbiddenException(
        `Acceso denegado: se requiere permiso en el módulo [${requisito.codigo}]`
      );
    }

    if (requisito.editar && !moduloAsignado.puedeEditar) {
      throw new ForbiddenException(
        `Acceso denegado: se requiere permiso de edición en el módulo [${requisito.codigo}]`
      );
    }

    return true;
  }
}