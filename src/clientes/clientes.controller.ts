import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ModulosGuard } from '../auth/guards/modulos.guard.js';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { ClientesService } from './clientes.service.js';
import { CreateClienteDto } from './dto/create-cliente.dto.js';
import { GetClientesQueryDto } from './dto/get-clientes-query.dto.js';
import { UpdateClienteDto } from './dto/update-cliente.dto.js';

@Controller('clientes')
@UseGuards(JwtAuthGuard, ModulosGuard)
@Modulo('ALQUILERES')
export class ClientesController {
  constructor(private readonly clientesService: ClientesService) {}

  @Get()
  findAll(@Query() query: GetClientesQueryDto) {
    return this.clientesService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.clientesService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Modulo('ALQUILERES', { editar: true })
  create(@Body() dto: CreateClienteDto) {
    return this.clientesService.create(dto);
  }

  @Patch(':id')
  @Modulo('ALQUILERES', { editar: true })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateClienteDto,
  ) {
    return this.clientesService.update(id, dto);
  }
}
