import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, Req, UploadedFiles, UseGuards, UseInterceptors, } from '@nestjs/common';
import { Request } from 'express';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { UsuarioAuthEntity } from '../auth/entities/usuario-auth.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ModulosGuard } from '../auth/guards/modulos.guard.js';
import { AlquileresService } from './alquileres.service.js';
import { AnularAlquilerDto, CreateAlquilerDto, GetAlquileresQueryDto, UpdateAlquilerDto } from './dto/index.js';
import { TipoChecklist } from '@prisma/client';
import { CrearChecklistDto } from '../checklists/dto/create-checklist.dto.js';
import { ParseImagesPipe } from '../common/pipes/parse-images.pipe.js';
import { FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { ParseChecklistDatosInterceptor } from '../checklists/interceptors/parse-checklist-datos.interceptor.js';

interface AuthenticatedRequest extends Request {
  user: UsuarioAuthEntity;
}

@Controller('alquileres')
@UseGuards(JwtAuthGuard, ModulosGuard)
@Modulo('ALQUILERES')
export class AlquileresController {
  constructor(private readonly alquileresService: AlquileresService) { }

  @Get()
  findAll(@Query() query: GetAlquileresQueryDto) {
    return this.alquileresService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.alquileresService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Modulo('ALQUILERES', { editar: true })
  create(
    @Body() dto: CreateAlquilerDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.alquileresService.create(dto, req.user.id);
  }

  @Patch(':id')
  @Modulo('ALQUILERES', { editar: true })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAlquilerDto,
  ) {
    return this.alquileresService.update(id, dto);
  }

  @Post(':id/anular')
  @HttpCode(HttpStatus.OK)
  @Modulo('ALQUILERES', { editar: true })
  anular(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AnularAlquilerDto,
  ) {
    return this.alquileresService.anular(id, dto);
  }

  @Get(':id/equipos/:equipoId/checklist')
  @Modulo('ALQUILERES')
  obtenerFormularioChecklist(
    @Param('id', ParseIntPipe) id: number,
    @Param('equipoId', ParseIntPipe) equipoId: number,
    @Query('tipo') tipo: TipoChecklist,
  ) {
    return this.alquileresService.obtenerDatosFormularioChecklist(id, equipoId, tipo);
  }

  @Post(':id/equipos/:equipoId/checklist')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(
    FilesInterceptor('fotos', 4, { storage: memoryStorage() }),
    ParseChecklistDatosInterceptor,
  )
  @Modulo('ALQUILERES', { editar: true })
  crearChecklistAlquiler(
    @Param('id', ParseIntPipe) id: number,
    @Param('equipoId', ParseIntPipe) equipoId: number,
    @Body('tipo') tipo: TipoChecklist,
    @Body('datos') dto: Omit<CrearChecklistDto, 'tipo'>,
    @UploadedFiles(new ParseImagesPipe({ min: 0, max: 4 })) fotos: Express.Multer.File[],
    @Req() req: AuthenticatedRequest,
  ) {
    return this.alquileresService.crearChecklistAlquiler(
      id,
      equipoId,
      tipo,
      dto,
      fotos,
      {
        id: req.user.id,
        nombre: req.user.nombre,
        apellido: req.user.apellido,
      },
    );
  }

}