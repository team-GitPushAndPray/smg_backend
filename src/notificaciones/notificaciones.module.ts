import { Module } from '@nestjs/common';
import { NotificacionesService } from './notificaciones.service.js';
import { NotificacionesController } from './notificaciones.controller.js';
import { TelegramNotificador } from './notificadores/telegram.notificador.js';
import { EmailNotificador } from './notificadores/email.notificador.js';

@Module({
  controllers: [NotificacionesController],
  providers: [NotificacionesService, TelegramNotificador, EmailNotificador],
  exports: [NotificacionesService]
})
export class NotificacionesModule {}
