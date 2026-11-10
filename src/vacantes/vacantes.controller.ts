import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { VacantesService } from './vacantes.service.js';
import { CreateVacanteDto, UpdateVacanteDto } from './dto/index.js';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('vacantes')
export class VacantesController {
  constructor(private readonly vacantesService: VacantesService) {}

  /**
   * GET /api/vacantes/publicas
   * Endpoint público (sin JWT) para mostrar las vacantes activas en el portal.
   */
  @Public()
  @Get('publicas')
  findAllPublicas() {
    return this.vacantesService.findAllPublicas();
  }

  /**
   * GET /api/vacantes
   * Listado administrativo de vacantes activas e inactivas con conteo de postulaciones.
   */
  @Modulo('POSTULACIONES')
  @Get()
  findAllPrivado() {
    return this.vacantesService.findAllPrivado();
  }

  /**
   * POST /api/vacantes
   * Alta de una nueva vacante.
   */
  @Modulo('POSTULACIONES', { editar: true })
  @Post()
  create(@Body() createVacanteDto: CreateVacanteDto) {
    return this.vacantesService.create(createVacanteDto);
  }

  /**
   * PATCH /api/vacantes/:id
   * Modificación de datos o activación/desactivación lógica de una vacante.
   */
  @Modulo('POSTULACIONES', { editar: true })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVacanteDto: UpdateVacanteDto,
  ) {
    return this.vacantesService.update(id, updateVacanteDto);
  }
}