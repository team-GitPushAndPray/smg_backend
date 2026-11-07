import { Body, Controller, Get, Headers, Param, ParseIntPipe, Patch, Query, Req, UnauthorizedException } from '@nestjs/common';
import { AvisosService } from './avisos.service.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { FiltroAvisosDto } from './dto/filtro-avisos.dto.js';
import { AtenderAvisoDto } from './dto/atender-aviso.dto.js';

@Controller('avisos')
export class AvisosController {
  constructor(private readonly avisosService: AvisosService) {}

  /**
   * GET /api/avisos/evaluar
   * Endpoint público para Vercel Cron protegido por CRON_SECRET
   */
  @Public()
  @Get('evaluar')
  async evaluarCron(@Headers('authorization') authHeader?: string) {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      throw new UnauthorizedException(
        'CRON_SECRET no está configurado en el servidor',
      );
    }

    const tokenEsperado = `Bearer ${cronSecret}`;

    if (!authHeader || authHeader.trim() !== tokenEsperado) {
      throw new UnauthorizedException(
        'No autorizado: CRON_SECRET inválido o ausente',
      );
    }

    return this.avisosService.evaluarTodasLasMaquinas();
  }

  /**
   * GET /api/avisos/resumen
   * Contador para la campanita de notificaciones: { pendientes, vencidos }
   */
  @Modulo('AVISOS')
  @Get('resumen')
  async obtenerResumen() {
    return this.avisosService.obtenerResumen();
  }

  /**
   * GET /api/avisos?estado=&tipo=
   * Listado con filtros opcionales y ordenamiento por prioridad
   */
  @Modulo('AVISOS')
  @Get()
  async findAll(@Query() filtros: FiltroAvisosDto) {
    return this.avisosService.findAll(filtros);
  }

  /**
   * PATCH /api/avisos/:id/atender
   * Marca un aviso como atendido y cierra en cascada services anteriores pendientes
   */
  @Modulo('AVISOS', { editar: true })
  @Patch(':id/atender')
  async atender(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtenderAvisoDto,
    @Req() req: { user: { id?: number; sub?: number } },
  ) {
    const usuarioId = Number(req.user.id ?? req.user.sub);
    return this.avisosService.atender(id, dto, usuarioId);
  }
}