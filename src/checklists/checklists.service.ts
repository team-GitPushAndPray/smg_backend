import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import 'multer';
import { EstadoItem, TipoChecklist, TipoPlantilla } from '@prisma/client';
import { isUUID } from 'class-validator';
import { HorometroHelper } from '../common/helpers/horometro.helper.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MAPA_OPCIONES_CHECKLIST, TIPOS_HABILITADOS_ADITAMENTO, TIPOS_HABILITADOS_MAQUINA } from './config/checklist-opciones.config.js';
import { ChecklistRespuestaItemDto, CrearChecklistDto } from './dto/create-checklist.dto.js';
import { ChecklistResumenResponse, CreatedChecklistResponseEntity } from './entities/created-checklist-response.entity.js';
import { PublicChecklistItemResponse, PublicChecklistOpcionResponse, PublicChecklistResponseEntity } from './entities/public-checklist-response.entity.js';
import { ImagesService } from '../images/images.service.js';

@Injectable()
export class ChecklistsService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly imagesService: ImagesService,
  ) { }


  async obtenerFormularioPorQrToken(
    qrToken: string,
  ): Promise<PublicChecklistResponseEntity> {
    if (!isUUID(qrToken)) {
      throw new NotFoundException('Equipo no encontrado');
    }

    const equipo = await this.prisma.equipo.findUnique({
      where: { qr_token: qrToken },
      select: {
        codigo_interno: true,
        marca: true,
        activo: true,
        categoria: {
          select: { nombre: true },
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

  async crearChecklistPorQrToken(
    qrToken: string,
    dto: CrearChecklistDto,
    fotos: Express.Multer.File[],
  ): Promise<CreatedChecklistResponseEntity> {
    if (!isUUID(qrToken)) throw new NotFoundException('Equipo no encontrado');

    // Buscar equipo activo y su relación con máquina
    const equipo = await this.prisma.equipo.findUnique({
      where: { qr_token: qrToken },
      include: { maquina: true },
    });

    if (!equipo || !equipo.activo) throw new NotFoundException('Equipo no encontrado');

    const esMaquina = equipo.maquina !== null;

    // Validar tipos de checklist permitidos (Usando el método privado)
    this.validarTipoChecklistPermitido(dto.tipo, esMaquina);

    // Validar horómetro ANTES de subir fotos a Cloudinary
    const horasAnteriores = esMaquina ? equipo.maquina!.horas_motor_actual : null;
    const horasMotorGuardar = esMaquina
      ? HorometroHelper.validarNuevasHoras(dto.horas_motor, horasAnteriores!)
      : null;

    // Obtener la plantilla correspondiente y validar ítems
    const tipoPlantilla =
      dto.tipo === TipoChecklist.ENTREGA || dto.tipo === TipoChecklist.DEVOLUCION
        ? TipoPlantilla.ALQUILERES
        : (dto.tipo as unknown as TipoPlantilla);

    const plantilla = await this.prisma.plantillaChecklist.findUnique({
      where: { tipo: tipoPlantilla },
      include: {
        items: {
          where: { activo: true },
          select: { id: true },
        },
      },
    });

    if (!plantilla) {
      throw new BadRequestException(`No existe una plantilla para el tipo ${dto.tipo}`);
    }

    this.validarIntegridadRespuestas(
      dto.respuestas,
      plantilla.items.map((i) => i.id),
    );

    // SUBIR FOTOS A CLOUDINARY
    const urlsFotos = await this.imagesService.subirMultiples(
      fotos,
      'checklists',
    );

    // TRANSACCIÓN ATÓMICA EN BASE DE DATOS
    const checklistCreado = await this.prisma.$transaction(async (tx) => {
      if (esMaquina && horasMotorGuardar !== null) {
        const resultadoUpdate = await tx.maquina.updateMany({
          where: {
            equipo_id: equipo.id,
            horas_motor_actual: { lte: horasMotorGuardar },
          },
          data: {
            horas_motor_actual: horasMotorGuardar,
            horas_actualizadas_en: new Date(),
          },
        });

        if (resultadoUpdate.count === 0) {
          throw new BadRequestException(
            'Las horas del equipo fueron actualizadas recientemente por otro operario con un valor mayor',
          );
        }
      }

      const observacionesLimpias = dto.observaciones?.trim() || null;

      return tx.checklist.create({
        data: {
          equipo_id: equipo.id,
          tipo: dto.tipo,
          horas_motor: horasMotorGuardar,
          responsable_nombre: dto.responsable_nombre.trim(),
          responsable_apellido: dto.responsable_apellido.trim(),
          observaciones: observacionesLimpias,
          respuestas: {
            create: dto.respuestas.map((r) => ({
              plantilla_item_id: r.plantilla_item_id,
              estado: r.estado,
            })),
          },
          fotos: {
            create: urlsFotos.map((url) => ({ url })),
          },
        },
        include: {
          fotos: {
            select: { url: true },
          },
        },
      });
    });

    // Calcular resumen 
    const resumen = this.calcularResumenRespuestas(dto.respuestas);

    return {
      id: checklistCreado.id,
      tipo: checklistCreado.tipo,
      fecha: checklistCreado.fecha,
      equipo: equipo.codigo_interno,
      horas_anteriores: horasAnteriores,
      horas_motor: horasMotorGuardar,
      resumen,
      fotos: checklistCreado.fotos.map((f) => f.url),
    };
  }


  //        MÉTODOS PRIVADOS AUXILIARES
  
  private validarTipoChecklistPermitido(
    tipo: TipoChecklist,
    esMaquina: boolean,
  ): void {
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
  ): void {
    const idsEnviados = respuestasEnviadas.map((r) => r.plantilla_item_id);
    const setIdsEnviados = new Set(idsEnviados);

    if (setIdsEnviados.size !== idsEnviados.length) {
      throw new BadRequestException('Las respuestas contienen ítems repetidos');
    }

    const setIdsPlantilla = new Set(idsActivosPlantilla);
    const sobrantes = idsEnviados.filter((id) => !setIdsPlantilla.has(id));

    if (sobrantes.length > 0) {
      throw new BadRequestException(`Los siguientes ítems no pertenecen a la plantilla activa: ${sobrantes.join(', ')}`);
    }

    const faltantes = idsActivosPlantilla.filter((id) => !setIdsEnviados.has(id));

    if (faltantes.length > 0) {
      throw new BadRequestException(`Faltan responder ${faltantes.length} item(s) obligatorio(s) de la plantilla`);
    }
  }

  private calcularResumenRespuestas(
    respuestas: ChecklistRespuestaItemDto[]
  ): ChecklistResumenResponse {
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