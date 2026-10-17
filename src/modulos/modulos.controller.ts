import { Controller, Get } from '@nestjs/common';
import { ModulosService } from './modulos.service.js';
import { RequiereModulo } from '../auth/decorators/requiere-modulo.decorator.js';

@RequiereModulo('configuracion')
@Controller('modulos')
export class ModulosController {
  constructor(private readonly modulosService: ModulosService) {}

  @Get()
  findAll() {
    return this.modulosService.findAll();
  }

}
