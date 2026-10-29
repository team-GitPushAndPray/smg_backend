import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { ChecklistsService } from './checklists.service.js';
import { PublicChecklistResponseEntity } from './entities/public-checklist-response.entity.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Public()
@Controller('public/checklists')
@UseGuards(ThrottlerGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class PublicChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Get(':qrToken')
  async obtenerFormularioPorQr(
    @Param('qrToken') qrToken: string,
  ): Promise<PublicChecklistResponseEntity> {
    return this.checklistsService.obtenerFormularioPorQrToken(qrToken);
  }
}