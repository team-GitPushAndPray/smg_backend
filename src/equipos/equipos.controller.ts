import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { EquiposService } from './equipos.service.js';
import { FiltrosEquiposDto, CreateEquipoDto, UpdateEquipoDto,  } from './dto/index.js';
import { Modulo } from '../auth/decorators/modulo.decorator.js';

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

  @Modulo('MAQUINAS', { editar: true })
  @Post()
  create(@Body() createEquipoDto: CreateEquipoDto) {
    return this.equiposService.create(createEquipoDto);
  }

  @Modulo('MAQUINAS', { editar: true })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEquipoDto: UpdateEquipoDto,
  ) {
    return this.equiposService.update(id, updateEquipoDto);
  }

}
