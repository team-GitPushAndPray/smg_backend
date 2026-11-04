import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import 'multer';
import { AplicaA, EstadoItem, Prisma, TipoChecklist, TipoPlantilla } from '@prisma/client';
import { isUUID } from 'class-validator';
import { HorometroHelper } from '../common/helpers/horometro.helper.js';
import { ImagesService } from '../images/images.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { MAPA_OPCIONES_CHECKLIST, TIPOS_HABILITADOS_ADITAMENTO, TIPOS_HABILITADOS_MAQUINA } from './config/checklist-opciones.config.js';
import { ChecklistRespuestaItemDto, CrearChecklistDto } from './dto/create-checklist.dto.js';
import { ChecklistResumenResponse, CreatedChecklistResponseEntity } from './entities/created-checklist-response.entity.js';
import { PublicChecklistOpcionResponse, PublicChecklistResponseEntity } from './entities/public-checklist-response.entity.js';

@Injectable()
export class ChecklistsService {

  constructor(
    private readonly prisma: PrismaService,
    private readonly imagesService: ImagesService,
  ) { }

  /**
   * Método centralizado para resolver la plantilla correspondiente a un equipo
  */
  async resolverPlantilla(tipoChecklist: TipoChecklist, equipoId: number) {
    const equipo = await this.prisma.equipo.findUnique({
      where: { id: equipoId },
      select: {
        id: true,
        activo: true,
        maquina: { select: { equipo_id: true } },
      },
    });

    if (!equipo || !equipo.activo) {
      throw new NotFoundException(`Equipo con ID ${equipoId} no encontrado o inactivo`);
    }

    const esMaquina = equipo.maquina !== null;
    this.validarTipoChecklistPermitido(tipoChecklist, esMaquina);

    let tipoPlantilla: TipoPlantilla;
    let aplicaA: AplicaA | null = null;

    if (tipoChecklist === TipoChecklist.DIARIO) {
      tipoPlantilla = TipoPlantilla.DIARIO;
    } else if (tipoChecklist === TipoChecklist.MANTENIMIENTO) {
      tipoPlantilla = TipoPlantilla.MANTENIMIENTO;
    } else {
      tipoPlantilla = TipoPlantilla.ALQUILERES;
      aplicaA = esMaquina ? AplicaA.MAQUINA : AplicaA.ADITAMENTO;
    }

    const plantilla = await this.prisma.plantillaChecklist.findFirst({
      where: {
        tipo: tipoPlantilla,
        aplica_a: aplicaA,
        activo: true,
      },
      include: {
        items: {
          where: { activo: true },
          orderBy: { orden: 'asc' },
          select: {
            id: true,
            nombre: true,
            orden: true,
          },
        },
      },
    });

    if (!plantilla) {
      throw new NotFoundException(
        `No se encontró una plantilla activa para el tipo ${tipoChecklist}` +
        (aplicaA ? ` (${aplicaA})` : ''),
      );
    }

    return plantilla;
  }


  async obtenerFormularioPorQrToken(
    qrToken: string,
  ): Promise<PublicChecklistResponseEntity> {
    if (!isUUID(qrToken)) {
      throw new NotFoundException('Equipo no encontrado');
    }

    const equipo = await this.prisma.equipo.findUnique({
      where: { qr_token: qrToken },
      select: {
        id: true,
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

    if (!equipo || !equipo.activo) {
      throw new NotFoundException('Equipo no encontrado');
    }

    const esMaquina = equipo.maquina !== null;
    const tiposChecklistHabilitados =
      (esMaquina ? TIPOS_HABILITADOS_MAQUINA : TIPOS_HABILITADOS_ADITAMENTO)
        .filter((tipo) => tipo === TipoChecklist.DIARIO || tipo === TipoChecklist.MANTENIMIENTO,
        );

    const opciones: PublicChecklistOpcionResponse[] = await Promise.all(
      tiposChecklistHabilitados.map(async (tipoChecklist) => {
        const config = MAPA_OPCIONES_CHECKLIST[tipoChecklist];
        const plantilla = await this.resolverPlantilla(tipoChecklist, equipo.id);

        return {
          tipo: config.tipo,
          titulo: config.titulo,
          items: plantilla.items.map((item) => ({
            id: item.id,
            nombre: item.nombre,
          })),
        };
      }),
    );

    return new PublicChecklistResponseEntity({
      equipo: {
        codigo_interno: equipo.codigo_interno,
        categoria: equipo.categoria.nombre,
        marca: equipo.marca,
        es_maquina: esMaquina,
        horas_motor_actual: esMaquina
          ? (equipo.maquina?.horas_motor_actual ?? null)
          : null,
        horas_actualizadas_en: esMaquina
          ? (equipo.maquina?.horas_actualizadas_en ?? null)
          : null,
      },
      opciones,
    });
  }


  async crearChecklistPorQrToken(
    qrToken: string,
    dto: CrearChecklistDto,
    fotos: Express.Multer.File[],
  ): Promise<CreatedChecklistResponseEntity> {
    if (!isUUID(qrToken)) throw new NotFoundException('Equipo no encontrado');

    if (
      dto.tipo === TipoChecklist.ENTREGA ||
      dto.tipo === TipoChecklist.DEVOLUCION
    ) {
      throw new BadRequestException(
        'Las entregas y devoluciones se registran desde el módulo de alquileres',
      );
    }

    const equipo = await this.prisma.equipo.findUnique({
      where: { qr_token: qrToken },
      select: { id: true },
    });

    if (!equipo) throw new NotFoundException('Equipo no encontrado');

    return this.procesarPersistenciaChecklist(
      equipo.id,
      dto.tipo,
      dto,
      fotos,
      {
        nombre: dto.responsable_nombre,
        apellido: dto.responsable_apellido,
        usuarioId: null,
      },
    );
  }
  

  async crearChecklistParaAlquiler(
    equipoId: number,
    tipoChecklist: TipoChecklist,
    dtoDatos: Omit<CrearChecklistDto, 'tipo'>,
    fotos: Express.Multer.File[],
    usuarioAuth: { id: number; nombre: string; apellido: string },
    txClient?: Prisma.TransactionClient,
  ) {
    const dtoCompleto: CrearChecklistDto = {
      ...dtoDatos,
      tipo: tipoChecklist,
      responsable_nombre: usuarioAuth.nombre,
      responsable_apellido: usuarioAuth.apellido,
    };

    return this.procesarPersistenciaChecklist(
      equipoId,
      tipoChecklist,
      dtoCompleto,
      fotos,
      {
        nombre: usuarioAuth.nombre,
        apellido: usuarioAuth.apellido,
        usuarioId: usuarioAuth.id,
      },
      txClient,
    );
  }


  //MÉTODOS PRIVADOS AUXILIARES

  private validarTipoChecklistPermitido(
    tipo: TipoChecklist,
    esMaquina: boolean,
  ): void {
    const tiposPermitidos = esMaquina
      ? TIPOS_HABILITADOS_MAQUINA
      : TIPOS_HABILITADOS_ADITAMENTO;

    if (!tiposPermitidos.includes(tipo)) {
      throw new BadRequestException(
        esMaquina
          ? `El tipo de checklist ${tipo} no es válido para una máquina`
          : `Un aditamento solo admite checklists de tipo ENTREGA o DEVOLUCION`,
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
      throw new BadRequestException(
        `Los siguientes ítems no pertenecen a la plantilla activa: ${sobrantes.join(', ')}`,
      );
    }

    const faltantes = idsActivosPlantilla.filter((id) => !setIdsEnviados.has(id));

    if (faltantes.length > 0) {
      throw new BadRequestException(
        `Faltan responder ${faltantes.length} item(s) obligatorio(s) de la plantilla`,
      );
    }
  }


  private calcularResumenRespuestas(
    respuestas: ChecklistRespuestaItemDto[],
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


  private async procesarPersistenciaChecklist(
    equipoId: number,
    tipoChecklist: TipoChecklist,
    dto: CrearChecklistDto,
    fotos: Express.Multer.File[],
    responsable: { nombre: string; apellido: string; usuarioId: number | null },
    txClient?: Prisma.TransactionClient,
  ) {
    const prisma = txClient ?? this.prisma;

    const equipo = await prisma.equipo.findUnique({
      where: { id: equipoId },
      include: { maquina: true },
    });

    if (!equipo || !equipo.activo) {
      throw new NotFoundException(`Equipo con ID ${equipoId} no encontrado o inactivo`);
    }

    const esMaquina = equipo.maquina !== null;
    this.validarTipoChecklistPermitido(tipoChecklist, esMaquina);

    const horasAnteriores = esMaquina ? equipo.maquina!.horas_motor_actual : null;
    const horasMotorGuardar = esMaquina
      ? HorometroHelper.validarNuevasHoras(dto.horas_motor ?? 0, horasAnteriores!)
      : null;

    const plantilla = await this.resolverPlantilla(tipoChecklist, equipo.id);

    this.validarIntegridadRespuestas(
      dto.respuestas,
      plantilla.items.map((i) => i.id),
    );

    const urlsFotos = await this.imagesService.subirMultiples(fotos, 'checklists');

    const ejecutarOperacion = async (tx: Prisma.TransactionClient) => {
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
          tipo: tipoChecklist,
          horas_motor: horasMotorGuardar,
          usuario_id: responsable.usuarioId,
          responsable_nombre: responsable.nombre.trim(),
          responsable_apellido: responsable.apellido.trim(),
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
          fotos: { select: { url: true } },
        },
      });
    };

    const checklistCreado = txClient
      ? await ejecutarOperacion(txClient)
      : await this.prisma.$transaction(async (tx) => ejecutarOperacion(tx));

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

}