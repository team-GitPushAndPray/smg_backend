import { Controller, Get, Post, Body, Patch, Param, Delete, ParseIntPipe } from '@nestjs/common';
import { VendedoresService } from './vendedores.service.js';
import { CreateVendedoresDto } from './dto/create-vendedores.dto.js';
import { UpdateVendedoresDto } from './dto/update-vendedores.dto.js';
import { Public } from '../auth/decorators/public.decorator.js';
import { RequiereModulo } from '../auth/decorators/requiere-modulo.decorator.js';

@RequiereModulo('vendedores')
@Controller('vendedores')
export class VendedoresController {
  constructor(private readonly vendedoresService: VendedoresService) {}


  // RUTAS PÚBLICAS
  @Public()
  @Get('public')
  findAllPublic() {
    return this.vendedoresService.findAllPublic();
  }


  // RUTAS ADMIN (Protegidas por el JwtAuthGuard global)
  @Post()
  async create(@Body() createVendedoresDto:CreateVendedoresDto) {
    await this.vendedoresService.create(createVendedoresDto);
    return { message: 'Vendedor  creado exitosamente' };
  }


  @Get('admin')
  findAllAdmin() {
    return this.vendedoresService.findAllAdmin();
  }


  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.vendedoresService.findOne(id);
  }


  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number, 
    @Body() updateVendedoresDto: UpdateVendedoresDto
  ) {
    await this.vendedoresService.update(id, updateVendedoresDto);
    return { message: 'Vendedor actualizado correctamente' };
  }


  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.vendedoresService.remove(id);
    return { message: 'Vendedor eliminado correctamente' };
  }
}
