import { Controller, Get, Post, Param, ParseIntPipe } from '@nestjs/common';
import { EquiposService } from './equipos.service.js';
import { Modulo } from '../auth/decorators/modulo.decorator.js';

@Modulo('MAQUINAS')
@Controller('equipos')
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equiposService.findOnePublic(id);
  }

}
