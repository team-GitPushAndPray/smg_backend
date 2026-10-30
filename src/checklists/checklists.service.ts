import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { EstadoItem, TipoChecklist, TipoPlantilla } from '@prisma/client';
import { isUUID } from 'class-validator';
import { HorometroHelper } from '../common/helpers/horometro.helper.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MAPA_OPCIONES_CHECKLIST, TIPOS_HABILITADOS_ADITAMENTO, TIPOS_HABILITADOS_MAQUINA } from './config/checklist-opciones.config.js';
import { ChecklistRespuestaItemDto, CrearChecklistDto } from './dto/create-checklist.dto.js';
import { ChecklistResumenResponse, CreatedChecklistResponseEntity } from './entities/created-checklist-response.entity.js';
import { PublicChecklistItemResponse, PublicChecklistOpcionResponse, PublicChecklistResponseEntity } from './entities/public-checklist-response.entity.js';

@Injectable()
export class ChecklistsService {

  constructor(private readonly prisma: PrismaService) { }


  async obtenerFormularioPorQrToken(
    qrToken: string,
  ): Promise<PublicChecklistResponseEntity> {
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


  // POST PÚBLICO DE CHECKLIST CON ACTUALIZACIÓN DE HORAS

  async crearCheckListPorQrToken(
    qrToken: string,
    dto: CrearChecklistDto,
  ): Promise<CreatedChecklistResponseEntity> {

    if (!isUUID(qrToken)) throw new NotFoundException('Equipo no encontrado');

    const equipo = await this.prisma.equipo.findUnique({
      where: { qr_token: qrToken },
      select: {
        id: true,
        codigo_interno: true,
        activo: true,
        maquina: {
          select: {
            horas_motor_actual: true,
          },
        },
      },
    });

    if (!equipo || !equipo.activo) throw new NotFoundException('Equipo no encontrado');

    const esMaquina = equipo.maquina !== null;

    // Validar que el tipo esté permitido para este equipo (DIARIO en aditamento -> 400)
    this.validarTipoChecklistPermitido(dto.tipo, esMaquina);

    // Resolver plantilla en base al tipo (ENTREGA/DEVOLUCION -> ALQUILERES)
    const configOpcion = MAPA_OPCIONES_CHECKLIST[dto.tipo];
    const plantilla = await this.prisma.plantillaChecklist.findUnique({
      where: { tipo: configOpcion.tipoPlantilla },
      select: {
        items: {
          where: { activo: true },
          select: { id: true },
        },
      },
    });

    if (!plantilla) throw new BadRequestException(`No se encontró la plantilla configurada para el tipo ${dto.tipo}`);

    // Validar respuestas: exactamente los ítems activos (ni faltan, ni sobran, ni se repiten)
    const idsActivosPlantilla = plantilla.items.map((item) => item.id);
    this.validarIntegridadRespuestas(dto.respuestas, idsActivosPlantilla);


    // Validar y procesar horas_motor (Máquina: obligatoria y >= actual | Aditamento: null)
    const horasAnteriores: number | null = esMaquina
      ? (equipo.maquina?.horas_motor_actual ?? 0)
      : null;

    const horasMotorGuardar: number | null = esMaquina
      ? HorometroHelper.validarNuevasHoras(dto.horas_motor, horasAnteriores!)
      : null;

    // TRANSACCIÓN ATÓMICA
    const checklistCreado = await this.prisma.$transaction( async (tx) => {

      const nuevoChecklist = await tx.checklist.create({
        data: {
          equipo_id: equipo.id,
          tipo: dto.tipo,
          horas_motor: horasMotorGuardar,
          responsable_nombre: dto.responsable_nombre,
          responsable_apellido: dto.responsable_apellido,
          observaciones: dto.observaciones ?? null,
        },
      });

      await tx.checklistRespuesta.createMany({
        data: dto.respuestas.map((r) => ({
          checklist_id: nuevoChecklist.id,
          plantilla_item_id: r.plantilla_item_id,
          estado: r.estado,
        })),
      });

      if (esMaquina && horasMotorGuardar !== null) {
        await HorometroHelper.actualizarHorasConcurrenciaSegura(
          tx,
          equipo.id,
          horasMotorGuardar,
        );
      }

      return nuevoChecklist
    });

    return new CreatedChecklistResponseEntity({
      id: checklistCreado.id,
      tipo: checklistCreado.tipo,
      fecha: checklistCreado.fecha,
      equipo: equipo.codigo_interno,
      horas_anteriores: horasAnteriores,
      horas_motor: horasMotorGuardar,
      resumen: this.calcularResumenRespuestas(dto.respuestas),
      fotos: [],
    });

  }


  // MÉTODOS PRIVADOS AUXILIARES
  private validarTipoChecklistPermitido(
    tipo: TipoChecklist,
    esMaquina: boolean,
  ) : void {
    const tiposPermitidos = esMaquina ? TIPOS_HABILITADOS_MAQUINA : TIPOS_HABILITADOS_ADITAMENTO;

    if (!tiposPermitidos.includes(tipo)) {
      throw new BadRequestException(
        esMaquina ? `El tipo de checklist ${tipo} no es válido para una máquina` :
        `Un aditamento solo admite checklists de tipo ENTREGA o DEVOLUCION`,
      );
    }
  }

  private validarIntegridadRespuestas(
    respuestasEnviadas: ChecklistRespuestaItemDto[],
    idsActivosPlantilla: number[],
  ) : void {
    const idsEnviados = respuestasEnviadas.map((r) => r.plantilla_item_id);
    const setIdsEnviados = new Set(idsEnviados);

    if (setIdsEnviados.size !== idsEnviados.length) throw new BadRequestException('Las respuestas contienen ítems repetidos');

    const setIdsPlantilla = new Set(idsActivosPlantilla);

    const sobrantes = idsEnviados.filter((id) => !setIdsPlantilla.has(id));

    if (sobrantes.length > 0) throw new BadRequestException(`Los siguientes ítems no pertenecen a la plantilla activa: ${sobrantes.join(', ')}`);
    
    const faltantes = idsActivosPlantilla.filter((id) => !setIdsEnviados.has(id));

    if (faltantes.length > 0) throw new BadRequestException(`Faltan responder ${faltantes.length} item(s) obligatorio(s) de la plantilla`);

  }

  private calcularResumenRespuestas(
    respuestas: ChecklistRespuestaItemDto[]
  ) : ChecklistResumenResponse {
    const resumen: ChecklistResumenResponse = {
      normales: 0,
      anormales: 0,
      no_aplica: 0,
    };

    for (const r of respuestas) {
      if (r.estado === EstadoItem.NORMAL) resumen.normales++;
      else if (r.estado === EstadoItem.ANORMAL) resumen.anormales++;
      else if (r.estado === EstadoItem.NO_APLICA) resumen.no_aplica++;
    }

    return resumen;

  }

}