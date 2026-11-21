import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module.js';
import { NotificacionesService } from './notificaciones.service.js';
import { NotificacionesController } from './notificaciones.controller.js';
import { TelegramNotificador } from './notificadores/telegram.notificador.js';
import { NotificacionesGestionService } from './notificaciones-gestion.service.js';
import { EmailNotificador } from './notificadores/email.notificador.js';

@Module({
  imports: [PrismaModule],
  controllers: [NotificacionesController],
  providers: [
    NotificacionesService, 
    NotificacionesGestionService,
    TelegramNotificador, 
    EmailNotificador
  ],
  exports: [NotificacionesService]
})
export class NotificacionesModule {}
