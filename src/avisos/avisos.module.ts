import { Module } from '@nestjs/common';
import { AvisosService } from './avisos.service.js';
import { AvisosController } from './avisos.controller.js';
import { PrismaModule } from '../prisma/prisma.module.js';
import { EscalonesServicioController } from './escalones-servicio.controller.js';
import { NotificacionesModule } from '../notificaciones/notificaciones.module.js';

@Module({
  imports: [PrismaModule, NotificacionesModule],
  controllers: [AvisosController, EscalonesServicioController],
  providers: [AvisosService],
  exports: [AvisosService],
})

export class AvisosModule {}