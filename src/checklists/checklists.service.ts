import { Injectable, NotFoundException } from '@nestjs/common';
import { TipoPlantilla } from '@prisma/client';
import { isUUID } from 'class-validator';
import { PrismaService } from '../prisma/prisma.service.js';
import { MAPA_OPCIONES_CHECKLIST, TIPOS_HABILITADOS_ADITAMENTO, TIPOS_HABILITADOS_MAQUINA} from './config/checklist-opciones.config.js';
import { PublicChecklistItemResponse, PublicChecklistOpcionResponse, PublicChecklistResponseEntity } from './entities/public-checklist-response.entity.js';

@Injectable()
export class ChecklistsService {

  constructor(private readonly prisma: PrismaService) {}

  
  async obtenerFormularioPorQrToken(
    qrToken: string,
  ) : Promise<PublicChecklistResponseEntity> {
    if (!isUUID(qrToken)) {
      throw new NotFoundException('Equipo no encontrado');
    }

    // Buscamos equipo por qr_token incluyendo únicamente los datos necesarios
    const equipo = await this.prisma.equipo.findUnique({
      where: { qr_token: qrToken },
      select: {
        codigo_interno: true,
        marca: true,
        activo: true,
        categoria: {
          select: {
            nombre: true,
          },
        },
        maquina: {
          select: {
            horas_motor_actual: true,
            horas_actualizadas_en: true,
          },
        },
      },

    });

    if (!equipo || !equipo.activo) throw new NotFoundException('Equipo no encontrado');

    const esMaquina = equipo.maquina !== null;

    const tiposChecklistHabilitados = esMaquina ? TIPOS_HABILITADOS_MAQUINA : TIPOS_HABILITADOS_ADITAMENTO;

    const tiposPlantillaRequeridos = Array.from(
      new Set(
        tiposChecklistHabilitados.map(
          tipo => MAPA_OPCIONES_CHECKLIST[tipo].tipoPlantilla,
        ),
      ),
    );

    const plantillasDB = await this.prisma.plantillaChecklist.findMany({
      where: {
        tipo: { in: tiposPlantillaRequeridos },
      },
      select: {
        tipo: true,
        items: {
          where: { activo: true },
          orderBy: { orden: 'asc' },
          select: {
            id: true,
            nombre: true,
          },
        },
      },
    });

    // Mapa en memoria 0(1) de TipoPlantilla -> items[]
    const itemsPorPlantilla = new Map<TipoPlantilla, PublicChecklistItemResponse[]>(
      plantillasDB.map((plantilla) => [plantilla.tipo, plantilla.items]),
    )

    const opciones: PublicChecklistOpcionResponse[] =
    tiposChecklistHabilitados.map((tipoChecklist) => {
      const config = MAPA_OPCIONES_CHECKLIST[tipoChecklist];

      return {
        tipo: config.tipo,
        titulo: config.titulo,
        items: itemsPorPlantilla.get(config.tipoPlantilla) ?? [],
      };
    });

    // Retornar entidad limpia sin equipo.id ni plantilla_id
    return new PublicChecklistResponseEntity({
      equipo: {
        codigo_interno: equipo.codigo_interno,
        categoria: equipo.categoria.nombre,
        marca: equipo.marca,
        es_maquina: esMaquina,
        horas_motor_actual: esMaquina ? (equipo.maquina?.horas_motor_actual ?? null) : null,
        horas_actualizadas_en: esMaquina ? (equipo.maquina?.horas_actualizadas_en ?? null) : null,
      },
      opciones,
    });

  }

}