import { Module } from '@nestjs/common';
import { GeminiService } from './gemini.service.js';
import { IaController } from './ia.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [IaController],
  providers: [GeminiService],
  exports: [GeminiService],
})
export class IaModule {}