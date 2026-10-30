import {
  BadRequestException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';

@Injectable()
export class ParseChecklistDatosInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const datosRaw = request.body?.datos;

    if (!datosRaw) {
      throw new BadRequestException(
        'El campo "datos" es obligatorio dentro del formulario multipart/form-data',
      );
    }

    if (typeof datosRaw === 'string') {
      try {
        request.body.datos = JSON.parse(datosRaw);
      } catch {
        throw new BadRequestException(
          'El campo "datos" no contiene un formato JSON válido',
        );
      }
    }

    if (
      !request.body.datos ||
      typeof request.body.datos !== 'object' ||
      Array.isArray(request.body.datos)
    ) {
      throw new BadRequestException(
        'El campo "datos" debe ser un objeto JSON válido',
      );
    }

    return next.handle();
  }
}