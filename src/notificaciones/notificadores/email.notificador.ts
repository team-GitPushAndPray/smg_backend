import { Injectable } from '@nestjs/common';
import { CanalNotificacion } from '@prisma/client';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { Notificador } from '../interfaces/notificador.interface.js';

@Injectable()
export class EmailNotificador implements Notificador {
  readonly canal = CanalNotificacion.EMAIL;
  private transporter: Transporter | null = null;

  private getTransporter(): { transporter: Transporter; user: string } {
    const user = process.env.MAIL_USER?.trim();
    const pass = process.env.MAIL_APP_PASSWORD?.trim();

    if (!user || !pass) {
      throw new Error('Canal no configurado');
    }

    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
      });
    }

    return { transporter: this.transporter, user };
  }

  async enviar(destino: string, mensaje: string): Promise<void> {
    const { transporter, user } = this.getTransporter();
    const fromName = process.env.MAIL_FROM_NAME?.trim() || 'SGM Avisos';

    await transporter.sendMail({
      from: `"${fromName}" <${user}>`,
      to: destino,
      subject: 'SGM · Aviso de mantenimiento',
      text: mensaje,
    });
  }
}