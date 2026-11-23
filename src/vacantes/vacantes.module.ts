import { Module } from '@nestjs/common';
import { VacantesService } from './vacantes.service.js';
import { VacantesController } from './vacantes.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { IaModule } from '../ia/ia.module.js';
import { VacantesResumenService } from './vacantes-resumen.service.js';

@Module({
  imports: [PrismaModule, IaModule],
  controllers: [VacantesController],
  providers: [VacantesService, VacantesResumenService],
  exports: [VacantesService],
})
export class VacantesModule {}
