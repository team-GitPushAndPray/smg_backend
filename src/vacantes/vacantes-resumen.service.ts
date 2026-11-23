import { BadRequestException, Injectable } from '@nestjs/common';
import { EstadoAnalisis, Prisma, ResumenVacanteIa } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { GeminiService } from '../ia/gemini.service.js';
import type { CandidatoParaResumen, TopCandidatoIA } from '../ia/interfaces/ia.interfaces.js';
import { ResumenVacanteEntity, TopCandidatoResumenView } from './entities/resumen-vacante.entity.js';
import { VacantesService } from './vacantes.service.js';


@Injectable()
export class VacantesResumenService {
  private static readonly MAX_CANDIDATOS = 30;

  constructor(
    private readonly prisma: PrismaService,
    private readonly vacantesService: VacantesService,
    private readonly geminiService: GeminiService,
  ) {}


  async generar(vacanteId: number): Promise<ResumenVacanteEntity> {
    const vacante = await this.vacantesService.obtenerVacanteOrThrow(vacanteId);

    const filtroAnalizadas: Prisma.AnalisisPostulacionWhereInput = {
      estado: EstadoAnalisis.COMPLETADO,
      puntaje: { not: null },
      postulacion: { vacante_id: vacanteId },
    };

    const [analisisList, totalAnalizadas] = await Promise.all([
      this.prisma.analisisPostulacion.findMany({
        where: filtroAnalizadas,
        orderBy: [
          { puntaje: 'desc' },
          { postulacion: { creado_en: 'asc' } },
        ],
        take: VacantesResumenService.MAX_CANDIDATOS,
        include: {
          postulacion: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
            },
          },
        },
      }),
      this.prisma.analisisPostulacion.count({ where: filtroAnalizadas }),
    ]);

    if (analisisList.length === 0) {
      throw new BadRequestException(
        'Todavía no hay postulaciones analizadas en esta vacante.',
      );
    }

    const candidatos: CandidatoParaResumen[] = analisisList.map((a) => ({
      postulacion_id: a.postulacion.id,
      nombre: `${a.postulacion.nombre} ${a.postulacion.apellido}`.trim(),
      puntaje: a.puntaje ?? 0,
      resumen_experiencia: a.resumen_experiencia ?? '',
      justificacion: a.justificacion ?? '',
    }));

    const resultado = await this.geminiService.resumirVacante({
      vacante: {
        titulo: vacante.titulo,
        descripcion: vacante.descripcion,
        requisitos: vacante.requisitos,
      },
      candidatos,
    });

    const ahora = new Date();
    const topJson: Prisma.InputJsonValue = resultado.top.map(
      ({ posicion, postulacion_id, motivo }) => ({
        posicion,
        postulacion_id,
        motivo,
      }),
    );

    const resumenGuardado = await this.prisma.resumenVacanteIa.upsert({
      where: { vacante_id: vacanteId },
      update: {
        top: topJson,
        comparacion: resultado.comparacion,
        recomendacion: resultado.recomendacion,
        cantidad_analizadas: totalAnalizadas,
        modelo: resultado.modelo,
        generado_en: ahora,
      },
      create: {
        vacante_id: vacanteId,
        top: topJson,
        comparacion: resultado.comparacion,
        recomendacion: resultado.recomendacion,
        cantidad_analizadas: totalAnalizadas,
        modelo: resultado.modelo,
        generado_en: ahora,
      },
    });

    return this.construirVistaResumen(
      resumenGuardado,
      vacante.requisitos_actualizados_en,
    );
  }


  async obtener(vacanteId: number): Promise<ResumenVacanteEntity | null> {
    const vacante = await this.vacantesService.obtenerVacanteOrThrow(vacanteId);

    const resumen = await this.prisma.resumenVacanteIa.findUnique({
      where: { vacante_id: vacanteId },
    });

    if (!resumen) {
      return null;
    }

    return this.construirVistaResumen(
      resumen,
      vacante.requisitos_actualizados_en,
    );
  }


  private async construirVistaResumen(
    resumen: ResumenVacanteIa,
    requisitosActualizadosEn: Date | null,
  ): Promise<ResumenVacanteEntity> {
    const topGuardado = this.extraerTop(resumen.top);
    const idsTop = topGuardado.map((item) => item.postulacion_id);

    const [postulacionesTop, analisisPosterior] = await Promise.all([
      idsTop.length > 0
        ? this.prisma.postulacion.findMany({
            where: { id: { in: idsTop } },
            select: {
              id: true,
              nombre: true,
              apellido: true,
              analisis: {
                select: {
                  puntaje: true,
                },
              },
            },
          })
        : Promise.resolve([]),
      this.prisma.analisisPostulacion.findFirst({
        where: {
          postulacion: { vacante_id: resumen.vacante_id },
          analizado_en: { gt: resumen.generado_en },
        },
        select: { id: true },
      }),
    ]);

    const mapaPostulaciones = new Map(
      postulacionesTop.map((p) => [p.id, p]),
    );

    const topEnriquecido: TopCandidatoResumenView[] = topGuardado.map(
      (item) => {
        const postulacion = mapaPostulaciones.get(item.postulacion_id);
        return {
          posicion: item.posicion,
          postulacion_id: item.postulacion_id,
          nombre: postulacion
            ? `${postulacion.nombre} ${postulacion.apellido}`.trim()
            : '',
          puntaje: postulacion?.analisis?.puntaje ?? null,
          motivo: item.motivo,
        };
      },
    );

    const requisitosCambiaron = Boolean(
      requisitosActualizadosEn &&
        requisitosActualizadosEn.getTime() > resumen.generado_en.getTime(),
    );

    return new ResumenVacanteEntity({
      vacante_id: resumen.vacante_id,
      top: topEnriquecido,
      comparacion: resumen.comparacion,
      recomendacion: resumen.recomendacion,
      cantidad_analizadas: resumen.cantidad_analizadas,
      modelo: resumen.modelo,
      generado_en: resumen.generado_en,
      desactualizado: requisitosCambiaron || analisisPosterior !== null,
    });
  }

  private extraerTop(raw: Prisma.JsonValue): TopCandidatoIA[] {
    if (!Array.isArray(raw)) {
      return [];
    }

    const resultado: TopCandidatoIA[] = [];

    for (const item of raw) {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        continue;
      }

      const { posicion, postulacion_id, motivo } = item as Record<
        string,
        unknown
      >;

      if (
        typeof posicion === 'number' &&
        typeof postulacion_id === 'number' &&
        typeof motivo === 'string'
      ) {
        resultado.push({ posicion, postulacion_id, motivo });
      }
    }

    return resultado;
  }

}