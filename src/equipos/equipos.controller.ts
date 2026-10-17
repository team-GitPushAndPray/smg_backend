import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { EquiposService } from './equipos.service.js';
import { RequiereModulo } from '../auth/decorators/requiere-modulo.decorator.js';

@RequiereModulo('maquinas')
@Controller('equipos')
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equiposService.findOnePublic(id);
  }
}
