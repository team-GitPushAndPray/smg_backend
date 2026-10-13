import { Controller, Get, Post, Body, Patch, Param, Delete, ParseUUIDPipe } from '@nestjs/common';
import { VendedoresService } from './vendedores.service.js';
import { CreateVendedoresDto } from './dto/create-vendedores.dto.js';
import { UpdateVendedoresDto } from './dto/update-vendedores.dto.js';

@Controller('vendedores')
export class VendedoresController {
  constructor(private readonly vendedoresService: VendedoresService) {}


  // RUTAS PÚBLICAS (Para el Frontend del sitio)
  @Get('public')
  findAllPublic() {
    return this.vendedoresService.findAllPublic();
  }


  // RUTAS ADMIN (Temporalmente desprotegidas hasta crear el módulo Auth)
  @Post()
  // @UseGuards(JwtAuthGuard) <- Lo activaremos en la issue de Auth
  async create(@Body() createVendedoresDto:CreateVendedoresDto) {
    await this.vendedoresService.create(createVendedoresDto);

    return { message: 'Vendedor  creado exitosamente' };
  }


  @Get('admin')
  // @UseGuards(JwtAuthGuard) <- Lo activaremos en la issue de Auth
  findAllAdmin() {
    return this.vendedoresService.findAllAdmin();
  }


  @Get(':id')
  // @UseGuards(JwtAuthGuard) <- Lo activaremos en la issue de Auth
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vendedoresService.findOne(id);
  }


  @Patch(':id')
  // @UseGuards(JwtAuthGuard) <- Lo activaremos en la issue de Auth
  async update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateVendedoresDto: UpdateVendedoresDto
  ) {
    await this.vendedoresService.update(id, updateVendedoresDto);

    return { message: 'Vendedor actualizado correctamente' };
  }


  @Delete(':id')
  // @UseGuards(JwtAuthGuard) <- Lo activaremos en la issue de Auth
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.vendedoresService.remove(id);
    return { message: 'Vendedor eliminado correctamente' };
  }
}
