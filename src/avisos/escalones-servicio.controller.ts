import { Body, Controller, Get, Param, ParseIntPipe, Patch } from '@nestjs/common';
import { AvisosService } from './avisos.service.js';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { UpdateEscalonServicioDto } from './dto/update-escalon-servicio.dto.js';

@Controller('escalones-servicio')
export class EscalonesServicioController {
  constructor(private readonly avisosService: AvisosService) {}

  @Modulo('MAQUINAS')
  @Get()
  async findAll() {
    return this.avisosService.listarEscalones();
  }

  @Modulo('MAQUINAS', { editar: true })
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateEscalonServicioDto,
  ) {
    return this.avisosService.actualizarEscalon(id, dto);
  }
}