import { Module } from '@nestjs/common';
import { ModulosService } from './modulos.service.js';
import { ModulosController } from './modulos.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [ModulosController],
  providers: [ModulosService],
})
export class ModulosModule {}
