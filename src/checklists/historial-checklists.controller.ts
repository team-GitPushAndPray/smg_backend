import { Controller, Get, Param, ParseIntPipe, Query, UseGuards } from '@nestjs/common';
import { HistorialChecklistsService } from './historial-checklists.service.js';
import { GetHistorialChecklistsQueryDto } from './dto/get-historial-checklists-query.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';
import { ModulosGuard } from '../auth/guards/modulos.guard.js';
import { Modulo } from '../auth/decorators/modulo.decorator.js';

@Controller('equipos/:id/historial/checklists')
@UseGuards(JwtAuthGuard, ModulosGuard)
@Modulo('MAQUINAS')
export class HistorialChecklistsController {
  constructor( private readonly historialChecklistsService: HistorialChecklistsService) {}

  @Get()
  findAll(
    @Param('id', ParseIntPipe) id: number,
    @Query() query: GetHistorialChecklistsQueryDto,
  ) {
    return this.historialChecklistsService.findAllByEquipo(id, query);
  }
}