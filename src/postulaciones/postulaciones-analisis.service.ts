import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { GeminiService } from '../ia/gemini.service.js';
import { AnalisisPostulacion, EstadoAlquiler, EstadoAnalisis, Postulacion } from '@prisma/client';
import { ResultadoAnalisisCV } from '../ia/interfaces/ia.interfaces.js';


const DOWNLOAD_TIMEOUT_MS = 15_000;
const ERROR_DESCARGA_CV = 'No se pudo descargar el CV';

interface PostulacionParaAnalisis {
    id: number;
    cv_url: string;
    vacante: {
        titulo: string;
        descripcion: string;
        requisitos: string;
    };
}

@Injectable()
export class PostulacionesAnalisisService {
    private readonly logger = new Logger(PostulacionesAnalisisService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly geminiService: GeminiService,
    ) { }

    /**
     * Analiza una postulación usando el PDF en memoria (alta pública) o descargándolo desde cv_url. Nunca lanza excepciones
     */
    async analizar(
        postulacionId: number,
        pdf?: Buffer,
    ): Promise<AnalisisPostulacion | null> {
        try {
            const postulacion = await this.obtenerPostulacionConVacante(postulacionId);
            if (!postulacion) {
                this.logger.warn(
                    `No se encontró la postulación ${postulacionId} para analizar`,
                );
                return null;
            }

            return await this.ejecutarAnalisis(postulacion, pdf);
        } catch (error) {
            this.logger.error(`Error inesperado fuera del flujo controlado al analizar postulación ${postulacionId}: ${this.extraerMensajeError(error)}`);
            return null;
        }
    }

    /**
     * Re-analiza manualmente desde el panel admin
     */
    async reanalizar(postulacionId: number): Promise<AnalisisPostulacion> {
        const postulacion = await this.obtenerPostulacionConVacante(postulacionId);

        if (!postulacion) throw new NotFoundException(`No se encontró la postulación con id ${postulacionId}`);
        return this.ejecutarAnalisis(postulacion);
    }

    private async ejecutarAnalisis(
        postulacion: PostulacionParaAnalisis,
        pdf?: Buffer,
    ): Promise<AnalisisPostulacion> {
        try {
            const pdfBuffer = pdf ?? (await this.descargarCv(postulacion.cv_url));
            const resultado = await this.geminiService.analizarCv({
                pdf: pdfBuffer,
                vacante: postulacion.vacante
            });

            return await this.guardarCompletado(postulacion.id, resultado);
        } catch (error) {
            const detalle = this.extraerMensajeError(error);
            this.logger.warn(`Análisis en ERROR para postulación ${postulacion.id}: ${detalle}`);

            return this.guardarError(postulacion.id, detalle);
        }
    }

    private async obtenerPostulacionConVacante(
        postulacionId: number,
    ): Promise<PostulacionParaAnalisis | null> {
        return this.prisma.postulacion.findUnique({
            where: { id: postulacionId },
            select: {
                id: true,
                cv_url: true,
                vacante: {
                    select: {
                        titulo: true,
                        descripcion: true,
                        requisitos: true,
                    },
                },
            },
        });
    }

    private async descargarCv(cvUrl: string): Promise<Buffer> {
        try {
            const response = await fetch(cvUrl, {
                signal: AbortSignal.timeout(DOWNLOAD_TIMEOUT_MS),
            });

            if (!response.ok) throw new Error(ERROR_DESCARGA_CV);

            const buffer = Buffer.from(await response.arrayBuffer());
            if (!buffer.length) throw new Error(ERROR_DESCARGA_CV);

            return buffer;

        } catch (error) {
            throw new Error(ERROR_DESCARGA_CV);
        }
    }

    private guardarCompletado(
        postulacionId: number,
        resultado: ResultadoAnalisisCV,
    ): Promise<AnalisisPostulacion> {
        const data = {
            estado: EstadoAnalisis.COMPLETADO,
            puntaje: resultado.puntaje,
            resumen_experiencia: resultado.resumen_experiencia,
            justificacion: resultado.justificacion,
            modelo: resultado.modelo,
            version_prompt: resultado.version_prompt,
            error_detalle: null,
            analizado_en: new Date(),
        };

        return this.prisma.analisisPostulacion.upsert({
            where: { postulacion_id: postulacionId },
            update: data,
            create: {
                postulacion_id: postulacionId,
                ...data,
            },
        });
    }

    private guardarError(
        postulacionId: number,
        errorDetalle: string,
    ): Promise<AnalisisPostulacion> {
        const data = {
            estado: EstadoAnalisis.ERROR,
            puntaje: null,
            resumen_experiencia: null,
            justificacion: null,
            modelo: null,
            version_prompt: null,
            error_detalle: errorDetalle,
            analizado_en: new Date(),
        };

        return this.prisma.analisisPostulacion.upsert({
            where: { postulacion_id: postulacionId },
            update: data,
            create: {
                postulacion_id: postulacionId,
                ...data,
            },
        });
    }

    private extraerMensajeError(error: unknown): string {
        if (error instanceof Error && error.message.trim()) {
            return error.message.trim();
        }
        return 'Error desconocido al analizar la postulación';
    }
}