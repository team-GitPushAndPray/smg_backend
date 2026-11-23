import { Module } from '@nestjs/common';
import { PostulacionesService } from './postulaciones.service.js';
import { PostulacionesController } from './postulaciones.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { IaModule } from '../ia/ia.module.js';
import { PostulacionesAnalisisService } from './postulaciones-analisis.service.js';

@Module({
  imports: [PrismaModule, IaModule],
  controllers: [PostulacionesController],
  providers: [PostulacionesService, PostulacionesAnalisisService],
  exports: [PostulacionesService, PostulacionesAnalisisService],
})
export class PostulacionesModule {}
