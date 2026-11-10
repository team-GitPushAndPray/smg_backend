import { Module } from '@nestjs/common';
import { VacantesService } from './vacantes.service.js';
import { VacantesController } from './vacantes.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [VacantesController],
  providers: [VacantesService],
  exports: [VacantesService],
})
export class VacantesModule {}
