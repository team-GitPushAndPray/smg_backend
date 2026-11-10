import { Module } from '@nestjs/common';
import { PostulacionesService } from './postulaciones.service.js';
import { PostulacionesController } from './postulaciones.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [PostulacionesController],
  providers: [PostulacionesService],
  exports: [PostulacionesService],
})
export class PostulacionesModule {}
