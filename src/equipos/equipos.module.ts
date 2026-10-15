import { Module } from '@nestjs/common';
import { EquiposService } from './equipos.service.js';
import { EquiposController } from './equipos.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [EquiposController],
  providers: [EquiposService],
  exports: [EquiposService],
})
export class EquiposModule {}
