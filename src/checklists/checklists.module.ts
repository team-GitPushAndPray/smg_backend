import { Module } from '@nestjs/common';
import { ChecklistsService } from './checklists.service.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ImagesModule } from '../images/images.module.js';
import { PublicChecklistsController } from './public-checklists.controller.js';
import { HistorialChecklistsController } from './historial-checklists.controller.js';
import { HistorialChecklistsService } from './historial-checklists.service.js';
import { AvisosModule } from '../avisos/avisos.module.js';

@Module({
  imports: [
    PrismaModule, 
    ImagesModule,
    AvisosModule,
  ],
  controllers: [
    PublicChecklistsController,
    HistorialChecklistsController
  ],
  providers: [
    ChecklistsService,
    HistorialChecklistsService
  ],
  exports: [ChecklistsService],
})
export class ChecklistsModule {}
