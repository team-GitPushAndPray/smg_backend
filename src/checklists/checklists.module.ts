import { Module } from '@nestjs/common';
import { ChecklistsService } from './checklists.service.js';
import { PublicChecklistsController } from './public-checklists.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { ImagesModule } from '../images/images.module.js';

@Module({
  imports: [PrismaModule, ImagesModule],
  controllers: [PublicChecklistsController],
  providers: [ChecklistsService],
})
export class ChecklistsModule {}
