import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { EquiposService } from './equipos.service.js';

@Controller('equipos')
export class EquiposController {
  constructor(private readonly equiposService: EquiposService) {}

  // Endpoint interno/admin para ver un equipo por su ID estándar (/equipos/:id)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.equiposService.findOnePublic(id);
  }
}
