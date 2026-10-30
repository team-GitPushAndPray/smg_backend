import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Public } from '../auth/decorators/public.decorator.js';
import { ChecklistsService } from './checklists.service.js';
import { CrearChecklistDto } from './dto/create-checklist.dto.js';
import { CreatedChecklistResponseEntity } from './entities/created-checklist-response.entity.js';
import { PublicChecklistResponseEntity } from './entities/public-checklist-response.entity.js';
import { ParseChecklistDatosInterceptor } from './interceptors/parse-checklist-datos.interceptor.js';

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

  @Post(':qrToken')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(AnyFilesInterceptor(), ParseChecklistDatosInterceptor)
  async crearChecklistPorQr(
    @Param('qrToken') qrToken: string,
    @Body('datos') dto: CrearChecklistDto,
  ): Promise<CreatedChecklistResponseEntity> {
    return this.checklistsService.crearCheckListPorQrToken(qrToken, dto);
  }
}