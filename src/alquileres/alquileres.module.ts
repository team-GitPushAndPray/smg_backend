import { Module } from '@nestjs/common';
import { AlquileresService } from './alquileres.service.js';
import { AlquileresController } from './alquileres.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ChecklistsModule } from '../checklists/checklists.module.js';
import { AvisosModule } from '../avisos/avisos.module.js';

@Module({
  imports: [PrismaModule, ChecklistsModule, AvisosModule],
  controllers: [AlquileresController],
  providers: [AlquileresService],
  exports: [AlquileresService],
})
export class AlquileresModule {}
