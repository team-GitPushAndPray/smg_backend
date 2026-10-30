import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { memoryStorage } from 'multer';
import { FilesInterceptor } from '@nestjs/platform-express';
import { Public } from '../auth/decorators/public.decorator.js';
import { ChecklistsService } from './checklists.service.js';
import { CrearChecklistDto } from './dto/create-checklist.dto.js';
import { CreatedChecklistResponseEntity } from './entities/created-checklist-response.entity.js';
import { PublicChecklistResponseEntity } from './entities/public-checklist-response.entity.js';
import { ParseChecklistDatosInterceptor } from './interceptors/parse-checklist-datos.interceptor.js';
import { ParseImagesPipe } from '../common/pipes/parse-images.pipe.js';

@Public()
@Controller('public/checklists')
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
  @UseInterceptors(
    FilesInterceptor('fotos', 10, { storage: memoryStorage() }), 
    ParseChecklistDatosInterceptor)
  async crearChecklistPorQr(
    @Param('qrToken') qrToken: string,
    @Body('datos') dto: CrearChecklistDto,
    @UploadedFiles(new ParseImagesPipe({ min: 1, max: 4 }))
    fotos: Express.Multer.File[],
  ): Promise<CreatedChecklistResponseEntity> {
    return this.checklistsService.crearChecklistPorQrToken(qrToken, dto, fotos);
  }
}