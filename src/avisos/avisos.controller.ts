import { Controller, Get, Headers, UnauthorizedException } from '@nestjs/common';
import { AvisosService } from './avisos.service.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('avisos')
export class AvisosController {
  constructor(private readonly avisosService: AvisosService) {}

  /**
   * Endpoint invocado diariamente por Vercel Cron.
   * Protegido exclusivamente mediante Authorization: Bearer <CRON_SECRET> (sin JWT).
   */
  @Public()
  @Get('evaluar')
  async evaluarCron(@Headers('authorization') authHeader?: string) {
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret) {
      throw new UnauthorizedException('CRON_SECRET no está configurado en el servidor');
    }

    const tokenEsperado = `Bearer ${cronSecret}`;

    if (!authHeader || authHeader.trim() !== tokenEsperado) {
      throw new UnauthorizedException('No autorizado: CRON_SECRET inválido o ausente');
    }

    return this.avisosService.evaluarTodasLasMaquinas();
  }
}
