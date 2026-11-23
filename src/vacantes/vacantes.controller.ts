import { Body, Controller, Get, HttpCode, HttpStatus, Param, ParseIntPipe, Patch, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { VacantesService } from './vacantes.service.js';
import { VacantesResumenService } from './vacantes-resumen.service.js';
import { CreateVacanteDto, UpdateVacanteDto } from './dto/index.js';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { Public } from '../auth/decorators/public.decorator.js';

@Controller('vacantes')
export class VacantesController {
  constructor(
    private readonly vacantesService: VacantesService,
    private readonly vacantesResumenService: VacantesResumenService,
  ) {}

  @Public()
  @Get('publicas')
  findAllPublicas() {
    return this.vacantesService.findAllPublicas();
  }

  @Modulo('POSTULACIONES')
  @Get()
  findAllPrivado() {
    return this.vacantesService.findAllPrivado();
  }

  @Modulo('POSTULACIONES', { editar: true })
  @Post()
  create(@Body() createVacanteDto: CreateVacanteDto) {
    return this.vacantesService.create(createVacanteDto);
  }

  @Modulo('POSTULACIONES', { editar: true })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateVacanteDto: UpdateVacanteDto,
  ) {
    return this.vacantesService.update(id, updateVacanteDto);
  }

  @Modulo('POSTULACIONES', { editar: true })
  @HttpCode(HttpStatus.OK)
  @Post(':id/resumen-ia')
  generarResumenIa(@Param('id', ParseIntPipe) id: number) {
    return this.vacantesResumenService.generar(id);
  }

  @Modulo('POSTULACIONES')
  @Get(':id/resumen-ia')
  async obtenerResumenIa(
    @Param('id', ParseIntPipe) id: number,
    @Res() res: Response,
  ) {
    const resumen = await this.vacantesResumenService.obtener(id);
    return res.status(HttpStatus.OK).json(resumen);
  }
}