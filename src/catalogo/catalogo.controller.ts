import { Controller, Get, Post, Body, Patch, Param, Delete, Query, ParseIntPipe } from '@nestjs/common';
import { CatalogoService } from './catalogo.service.js';
import { FiltroCatalogoDto } from './dto/filtro-catalogo.dto.js';
import { CatalogoEquipoEntity } from './entities/catalogo-equipo.entity.js'

@Controller('catalogo')
export class CatalogoController {
  constructor(private readonly catalogoService: CatalogoService) {}

  @Get()
  async findAll(
    @Query() filtros: FiltroCatalogoDto,
  ): Promise<CatalogoEquipoEntity[]> {
    return this.catalogoService.findAll(filtros)    
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number,
) : Promise<CatalogoEquipoEntity> {
    return this.catalogoService.findOne(id);
  }

}
