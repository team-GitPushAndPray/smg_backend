import { Controller, Get, Post, Body, Patch, Param, Put, ParseIntPipe } from '@nestjs/common';
import { RolesService } from './roles.service.js';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { CreateRolDto, UpdateRolModulosDto, UpdateRolDto } from './dto/index.js';

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
    @Param('id', ParseIntPipe) id: number, 
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