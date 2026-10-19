import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { EquiposService } from './equipos.service.js';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { FiltrosEquiposDto } from './dto/filtro-equipos.dto.js';

@Modulo('MAQUINAS')
@Controller('equipos')
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  @Get()
  findAll(@Query() filtros: FiltrosEquiposDto) {
    return this.equiposService.findAllPrivado(filtros);
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equiposService.findOnePrivado(id);
  }

}
