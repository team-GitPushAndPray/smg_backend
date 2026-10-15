import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { UsersModule } from './users/users.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CatalogoModule } from './catalogo/catalogo.module.js';
import { AppController } from './app.controller.js';
import { VendedoresModule } from './vendedores/vendedores.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { EquiposModule } from './equipos/equipos.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [ PrismaModule, UsersModule, CatalogoModule, VendedoresModule, EquiposModule],
  controllers: [AppController],
  providers: [PrismaService],
  exports: [PrismaService]
})
export class AppModule {}
