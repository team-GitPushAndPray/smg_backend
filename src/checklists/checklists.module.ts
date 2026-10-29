import { Module } from '@nestjs/common';
import { ChecklistsService } from './checklists.service.js';
import { PublicChecklistsController } from './public-checklists.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [PublicChecklistsController],
  providers: [ChecklistsService],
})
export class ChecklistsModule {}
