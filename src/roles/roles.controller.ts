import { Controller, Get, Post, Body, Patch, Param, Put, ParseIntPipe } from '@nestjs/common';
import { RolesService } from './roles.service.js';
import { RequiereModulo } from '../auth/decorators/requiere-modulo.decorator.js';
import { CreateRolDto } from './dto/create-rol.dto.js';
import { UpdateRolDto } from './dto/update-rol.dto.js';
import { UpdateRolModulosDto } from './dto/update-rol.modulos.dto.js';

@RequiereModulo('configuracion')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}


  @Get()
  findAll() {
    return this.rolesService.findAll();
  }


  @Post()
  create(@Body() createRolDto: CreateRolDto) {
    return this.rolesService.create(createRolDto);
  }


  @Patch(':id')
  update(
    @Param('id') id: number, 
    @Body() updateRolDto: UpdateRolDto) {
    return this.rolesService.update(id, updateRolDto);
  }


  @Put(':id/modulos')
  replaceModulos(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRolModulosDto: UpdateRolModulosDto,
  ) {
    return this.rolesService.replaceModulos(id, updateRolModulosDto);
  }

}
