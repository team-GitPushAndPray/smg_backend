import { Controller, Get, Post, Body, Patch, Param, Put, ParseIntPipe } from '@nestjs/common';
import { RolesService } from './roles.service.js';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { CreateRolDto } from './dto/create-rol.dto.js';
import { UpdateRolDto } from './dto/update-rol.dto.js';
import { UpdateRolModulosDto } from './dto/update-rol.modulos.dto.js';

@Modulo('CONFIGURACION')
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}


  @Get()
  findAll() {
    return this.rolesService.findAll();
  }


  @Modulo('CONFIGURACION', { editar: true })
  @Post()
  create(@Body() createRolDto: CreateRolDto) {
    return this.rolesService.create(createRolDto);
  }


  @Modulo('CONFIGURACION', { editar: true })
  @Patch(':id')
  update(
    @Param('id') id: number, 
    @Body() updateRolDto: UpdateRolDto) {
    return this.rolesService.update(id, updateRolDto);
  }


  @Modulo('CONFIGURACION', { editar: true })
  @Put(':id/modulos')
  replaceModulos(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateRolModulosDto: UpdateRolModulosDto,
  ) {
    return this.rolesService.replaceModulos(id, updateRolModulosDto);
  }

}
