import { Controller, Get, Post, Body, Patch, Param, ParseIntPipe, Req } from '@nestjs/common';
import { UsuariosService } from './usuarios.service.js';
import { CreateUsuarioDto } from './dto/create-usuario.dto.js';
import { UpdateUsuarioDto } from './dto/update-usuario.dto.js';
import { Modulo } from '../auth/decorators/modulo.decorator.js';
import { UpdateEstadoUsuarioDto } from './dto/update-estado-usuario.dto.js';

@Modulo('CONFIGURACION')
@Controller('usuarios')
export class UsuariosController {

  constructor(private readonly usuariosService: UsuariosService) {}

  
  @Get()
  findAll() {
    return this.usuariosService.findAll();
  }


  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usuariosService.findOne(id);
  }


  @Modulo('CONFIGURACION', { editar: true })
  @Post()
  create(@Body() createUsuarioDto: CreateUsuarioDto) {
    return this.usuariosService.create(createUsuarioDto);
  }


  @Modulo('CONFIGURACION', { editar: true })
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateUsuarioDto: UpdateUsuarioDto) {
    return this.usuariosService.update(id, updateUsuarioDto);
  }


  @Modulo('CONFIGURACION', { editar: true })
  @Patch(':id/estado')
  updateEstado(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateEstadoDto: UpdateEstadoUsuarioDto,
    @Req() req: any,
  ) {
    return this.usuariosService.updateEstado(
      id,
      updateEstadoDto.activo,
      req.user.id
    );
  }

}