import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus, Req, Get, Query, Param, ParseIntPipe } from '@nestjs/common';
import { AlquileresService } from './alquileres.service.js';
import { CreateAlquilerDto } from './dto/create-alquileres.dto.js';
import { UsuarioAuthEntity } from '../auth/entities/usuario-auth.entity.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ModulosGuard } from '../auth/guards/modulos.guard.js';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { GetAlquileresQueryDto } from './dto/get-alquileres-query.dto.js';

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

}