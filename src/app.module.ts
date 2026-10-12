import { Module } from '@nestjs/common';
import { createObserveModule } from '@nestjs/observe';
import { UsersModule } from './users/users.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { CatalogoModule } from './catalogo/catalogo.module.js';
import { AppController } from './app.controller.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [ PrismaModule, UsersModule, CatalogoModule],
  controllers: [AppController]
})
export class AppModule {}
