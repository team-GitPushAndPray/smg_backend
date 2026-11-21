import { BadRequestException, Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { NotificacionesService } from './notificaciones.service.js';
import { NotificacionesGestionService } from './notificaciones-gestion.service.js';
import { PruebaNotificacionDto } from './dto/prueba-notificacion.dto.js';
import { CrearReglaNotificacionDto } from './dto/crear-regla-notificacion.dto.js';
import { ActualizarReglaNotificacionDto } from './dto/actualizar-regla-notificacion.dto.js';
import { FiltroRegistroNotificacionesDto } from './dto/filtro-registro-notificaciones.dto.js';

@Controller('notificaciones')
export class NotificacionesController {
  constructor(
    private readonly notificacionesService: NotificacionesService,
    private readonly gestionService: NotificacionesGestionService,
  ) {}

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

  @Get('reglas')
  @Modulo('AVISOS')
  listarReglas() {
    return this.gestionService.listarReglas();
  }

  @Post('reglas')
  @Modulo('AVISOS', { editar: true })
  crearRegla(@Body() dto: CrearReglaNotificacionDto) {
    return this.gestionService.crearRegla(dto);
  }

  @Patch('reglas/:id')
  @Modulo('AVISOS', { editar: true })
  actualizarRegla(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ActualizarReglaNotificacionDto,
  ) {
    return this.gestionService.actualizarRegla(id, dto);
  }

  @Get('registro')
  @Modulo('AVISOS')
  listarRegistro(@Query() filtros: FiltroRegistroNotificacionesDto) {
    return this.gestionService.listarRegistro(filtros);
  }
}