import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { PrismaModule } from './prisma/prisma.module.js';
import { CatalogoModule } from './catalogo/catalogo.module.js';
import { AppController } from './app.controller.js';
import { VendedoresModule } from './vendedores/vendedores.module.js';
import { PrismaService } from './prisma/prisma.service.js';
import { EquiposModule } from './equipos/equipos.module.js';
import { AuthModule } from './auth/auth.module.js';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [ PrismaModule, CatalogoModule, VendedoresModule, EquiposModule, AuthModule],
  controllers: [AppController],
  providers: [PrismaService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    }
  ],
  exports: [PrismaService]
})
export class AppModule {}
