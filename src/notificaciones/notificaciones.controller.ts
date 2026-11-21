import { BadRequestException, Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { NotificacionesService } from './notificaciones.service.js';
import { PruebaNotificacionDto } from './dto/prueba-notificacion.dto.js';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(private readonly notificacionesService: NotificacionesService) {}

  @Post('prueba')
  @HttpCode(HttpStatus.OK)
  @Modulo('AVISOS', { editar: true })
  async enviarPrueba(@Body() dto: PruebaNotificacionDto) {
    try {
      const notificador = this.notificacionesService.obtener(dto.canal);
      await notificador.enviar(dto.destino, '✅ Mensaje de prueba de SGM');

      return {
        ok: true,
        canal: dto.canal,
        destino: dto.destino,
        mensaje: 'Mensaje de prueba enviado correctamente',
      };
    } catch (error: any) {
      throw new BadRequestException(
        error?.message || 'Error al enviar la notificación de prueba',
      );
    }
  }
}