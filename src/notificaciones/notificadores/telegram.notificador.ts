import { Injectable } from '@nestjs/common';
import { CanalNotificacion } from '@prisma/client';
import { Notificador } from '../interfaces/notificador.interface.js';

interface TelegramResponse {
  ok: boolean;
  description?: string;
}

@Injectable()
export class TelegramNotificador implements Notificador {
  readonly canal = CanalNotificacion.TELEGRAM;

  async enviar(destino: string, mensaje: string): Promise<void> {
    const token = process.env.TELEGRAM_BOT_TOKEN?.trim();

    if (!token) {
      throw new Error('Canal no configurado');
    }

    const url = `https://api.telegram.org/bot${token}/sendMessage`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: destino,
          text: mensaje,
        }),
        signal: AbortSignal.timeout(8000),
      });
    } catch (error: any) {
      if (error?.name === 'TimeoutError' || error?.name === 'AbortError') {
        throw new Error('Tiempo de espera agotado al conectar con Telegram (8s)');
      }
      throw new Error(error?.message || 'Error de red al conectar con Telegram');
    }

    let data: TelegramResponse | null = null;
    try {
      data = (await response.json()) as TelegramResponse;
    } catch {
    }

    if (!response.ok || !data?.ok) {
      throw new Error(
        data?.description || `Error de Telegram (HTTP ${response.status})`,
      );
    }
  }
}