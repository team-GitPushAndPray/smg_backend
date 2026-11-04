import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, Req, UseGuards, } from '@nestjs/common';
import { Request } from 'express';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { UsuarioAuthEntity } from '../auth/entities/usuario-auth.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ModulosGuard } from '../auth/guards/modulos.guard.js';
import { AlquileresService } from './alquileres.service.js';
import { AnularAlquilerDto, CreateAlquilerDto, GetAlquileresQueryDto, UpdateAlquilerDto } from './dto/index.js';

interface AuthenticatedRequest extends Request {
  user: UsuarioAuthEntity;
}

@Controller('alquileres')
@UseGuards(JwtAuthGuard, ModulosGuard)
@Modulo('ALQUILERES')
export class AlquileresController {
  constructor(private readonly alquileresService: AlquileresService) {}

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

}