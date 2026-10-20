import { Controller, Get } from '@nestjs/common';
import { ModulosService } from './modulos.service.js';
import { Modulo } from '../auth/decorators/modulo.decorator.js';

@Modulo('CONFIGURACION')
@Controller('modulos')
export class ModulosController {
  constructor(private readonly modulosService: ModulosService) {}

  @Get()
  findAll() {
    return this.modulosService.findAll();
  }

}
