import { Module } from '@nestjs/common';
import { VendedoresService } from './vendedores.service.js';
import { VendedoresController } from './vendedores.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';

@Module({
  imports: [PrismaModule],
  controllers: [VendedoresController],
  providers: [VendedoresService],
})
export class VendedoresModule {}
