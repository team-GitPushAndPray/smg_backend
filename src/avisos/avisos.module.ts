import { Module } from '@nestjs/common';
import { AvisosService } from './avisos.service.js';
import { AvisosController } from './avisos.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [AvisosController],
  providers: [AvisosService],
  exports: [AvisosService],
})

export class AvisosModule {}