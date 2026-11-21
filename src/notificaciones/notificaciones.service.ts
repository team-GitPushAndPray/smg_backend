import { Injectable } from '@nestjs/common';
import { CanalNotificacion } from '@prisma/client';
import { Notificador } from './interfaces/notificador.interface.js';
import { TelegramNotificador } from './notificadores/telegram.notificador.js';
import { EmailNotificador } from './notificadores/email.notificador.js';

@Injectable()
export class NotificacionesService {
  private readonly notificadores: Map<CanalNotificacion, Notificador>;

  constructor(
    telegramNotificador: TelegramNotificador,
    emailNotificador: EmailNotificador,
  ) {
    this.notificadores = new Map<CanalNotificacion, Notificador>([
      [telegramNotificador.canal, telegramNotificador],
      [emailNotificador.canal, emailNotificador],
    ]);
  }

  obtener(canal: CanalNotificacion): Notificador {
    const notificador = this.notificadores.get(canal);
    if (!notificador) {
      throw new Error(`Canal no soportado: ${canal}`);
    }
    return notificador;
  }
}