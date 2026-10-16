import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { CatalogoService } from './catalogo.service.js';
import { FiltroCatalogoDto } from './dto/filtro-catalogo.dto.js';
import { CatalogoEquipoEntity } from './entities/catalogo-equipo.entity.js'
import { Public } from '../auth/decorators/public.decorator.js';

@Public()
@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get()
  async findAll(
    @Query() filtros: FiltroCatalogoDto,
  ): Promise<CatalogoEquipoEntity[]> {
    return this.catalogoService.findAll(filtros)    
  }

  @Get('id=:id')
  async findOne(@Param('id', ParseIntPipe) id: number,
) : Promise<CatalogoEquipoEntity> {
    return this.catalogoService.findOne(id);
  }

}
