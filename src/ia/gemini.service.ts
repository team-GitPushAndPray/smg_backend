import { BadGatewayException, GatewayTimeoutException, HttpException, HttpStatus, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { GoogleGenAI } from '@google/genai';
import { GEMINI_MODELO_DEFAULT, GEMINI_TIMEOUT_MS } from './constants/gemini.constants.js';
import { AnalizarCVParams, GenerarJsonParams, GenerarJsonResultado, RespuestaAnalisisRaw, RespuestaResumenRaw, ResultadoAnalisisCV, ResultadoResumenVacante, ResumirVacanteParams, TopCandidatoIA } from './interfaces/ia.interfaces.js';
import { construirMensajeVacante, SYSTEM_INSTRUCTION_ANALISIS_CV, VERSION_PROMPT_ANALISIS } from './prompts/analisis-cv.prompt.js';
import { construirMensajeResumenVacante, SYSTEM_INSTRUCTION_RESUMEN_VACANTE, VERSION_PROMPT_RESUMEN } from './prompts/resumen-vacante.prompt.js';
import { SCHEMA_ANALISIS_CV, SCHEMA_RESUMEN_VACANTE } from './schemas/gemini.schemas.js';


@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly ai: GoogleGenAI | null;
  private readonly modelo: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    this.modelo = process.env.GEMINI_MODEL?.trim() || GEMINI_MODELO_DEFAULT;

    if (!apiKey) {
      this.ai = null;
      this.logger.warn(
        'GEMINI_API_KEY no configurada. La app inicia sin funcionalidad de IA.',
      );
      return;
    }

    this.ai = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: GEMINI_TIMEOUT_MS },
    });
  }


  async generarJson<T>({
    systemInstruction,
    contenido,
    schema,
  }: GenerarJsonParams): Promise<GenerarJsonResultado<T>> {
    if (!this.ai) {
      throw new ServiceUnavailableException('IA no configurada');
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    try {
      const response = await this.ai.models.generateContent({
        model: this.modelo,
        contents: contenido,
        config: {
          temperature: 0.1,
          responseMimeType: 'application/json',
          responseSchema: schema,
          systemInstruction,
          abortSignal: controller.signal,
        },
      });

      const rawText = response.text?.trim();
      if (!rawText) {
        throw new BadGatewayException('La IA devolvió una respuesta inválida.');
      }

      try {
        const data = JSON.parse(rawText) as T;
        return { data, modelo: this.modelo };
      } catch {
        this.logger.warn(`JSON inválido recibido de Gemini: ${rawText}`);
        throw new BadGatewayException('La IA devolvió una respuesta inválida.');
      }
    } catch (error) {
      throw this.traducirError(error, controller.signal.aborted);
    } finally {
      clearTimeout(timer);
    }
  }


  async analizarCv({
    pdf,
    vacante,
  }: AnalizarCVParams): Promise<ResultadoAnalisisCV> {
    const contenido = [
      {
        inlineData: {
          mimeType: 'application/pdf',
          data: pdf.toString('base64'),
        },
      },
      {
        text: construirMensajeVacante(vacante),
      },
    ];

    const { data, modelo } = await this.generarJson<RespuestaAnalisisRaw>({
      systemInstruction: SYSTEM_INSTRUCTION_ANALISIS_CV,
      contenido,
      schema: SCHEMA_ANALISIS_CV,
    });

    if (!this.esAnalisisValido(data)) {
      this.logger.warn(
        `Estructura de análisis inválida: ${JSON.stringify(data)}`,
      );
      throw new BadGatewayException('La IA devolvió una respuesta inválida.');
    }

    return {
      puntaje: data.puntaje,
      resumen_experiencia: data.resumen_experiencia.trim(),
      justificacion: data.justificacion.trim(),
      modelo,
      version_prompt: VERSION_PROMPT_ANALISIS,
    };
  }


  async resumirVacante({
    vacante,
    candidatos,
  }: ResumirVacanteParams): Promise<ResultadoResumenVacante> {
    const { data, modelo } = await this.generarJson<RespuestaResumenRaw>({
      systemInstruction: SYSTEM_INSTRUCTION_RESUMEN_VACANTE,
      contenido: construirMensajeResumenVacante(vacante, candidatos),
      schema: SCHEMA_RESUMEN_VACANTE,
    });

    const idsPermitidos = new Set(candidatos.map((c) => c.postulacion_id));
    const maxTop = Math.min(3, candidatos.length);

    if (!this.esResumenValido(data, idsPermitidos, maxTop)) {
      this.logger.warn(
        `Estructura de resumen inválida: ${JSON.stringify(data)}`,
      );
      throw new BadGatewayException('La IA devolvió una respuesta inválida.');
    }

    const topOrdenado = [...data.top]
      .sort((a, b) => a.posicion - b.posicion)
      .map((item, idx) => ({
        posicion: idx + 1,
        postulacion_id: item.postulacion_id,
        motivo: item.motivo.trim(),
      }));

    return {
      top: topOrdenado,
      comparacion: data.comparacion.trim(),
      recomendacion: data.recomendacion.trim(),
      modelo,
      version_prompt: VERSION_PROMPT_RESUMEN,
    };
  }


  private esResumenValido(
    data: unknown,
    idsPermitidos: Set<number>,
    maxTop: number,
  ): data is {
    top: TopCandidatoIA[];
    comparacion: string;
    recomendacion: string;
  } {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const obj = data as RespuestaResumenRaw;
    if (
      !Array.isArray(obj.top) ||
      obj.top.length === 0 ||
      obj.top.length > maxTop
    ) {
      return false;
    }

    const comparacionValida =
      typeof obj.comparacion === 'string' && obj.comparacion.trim().length > 0;
    const recomendacionValida =
      typeof obj.recomendacion === 'string' &&
      obj.recomendacion.trim().length > 0;

    if (!comparacionValida || !recomendacionValida) {
      return false;
    }

    const idsVistos = new Set<number>();

    for (const item of obj.top) {
      if (!item || typeof item !== 'object') return false;
      const { posicion, postulacion_id, motivo } = item as Record<
        string,
        unknown
      >;

      if (
        typeof posicion !== 'number' ||
        !Number.isInteger(posicion) ||
        posicion < 1
      ) {
        return false;
      }

      if (
        typeof postulacion_id !== 'number' ||
        !Number.isInteger(postulacion_id) ||
        !idsPermitidos.has(postulacion_id) ||
        idsVistos.has(postulacion_id)
      ) {
        return false;
      }

      if (typeof motivo !== 'string' || motivo.trim().length === 0) {
        return false;
      }

      idsVistos.add(postulacion_id);
    }

    return true;
  }


  private esAnalisisValido(
    data: unknown,
  ): data is {
    puntaje: number;
    resumen_experiencia: string;
    justificacion: string;
  } {
    if (!data || typeof data !== 'object') {
      return false;
    }

    const obj = data as RespuestaAnalisisRaw;
    const puntajeValido =
      typeof obj.puntaje === 'number' &&
      Number.isInteger(obj.puntaje) &&
      obj.puntaje >= 0 &&
      obj.puntaje <= 100;

    const resumenValido =
      typeof obj.resumen_experiencia === 'string' &&
      obj.resumen_experiencia.trim().length > 0;

    const justificacionValida =
      typeof obj.justificacion === 'string' &&
      obj.justificacion.trim().length > 0;

    return puntajeValido && resumenValido && justificacionValida;
  }


  private traducirError(error: unknown, fueAbortado: boolean): HttpException {
    if (error instanceof HttpException) {
      return error;
    }

    const err = error as {
      status?: number;
      code?: number;
      name?: string;
      message?: string;
    };

    const mensajeOriginal =
      err?.message || 'Error desconocido al consultar la IA';
    const mensajeLower = mensajeOriginal.toLowerCase();

    if (
      fueAbortado ||
      err?.name === 'AbortError' ||
      mensajeLower.includes('timeout') ||
      mensajeLower.includes('aborted')
    ) {
      return new GatewayTimeoutException('La IA tardó demasiado en responder.');
    }

    if (
      err?.status === 429 ||
      err?.code === 429 ||
      mensajeOriginal.includes('429') ||
      mensajeOriginal.includes('RESOURCE_EXHAUSTED')
    ) {
      return new HttpException(
        'Se alcanzó el límite de consultas de la IA. Reintentá en un minuto.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    this.logger.error(`Error al consultar Gemini: ${mensajeOriginal}`);
    return new BadGatewayException(mensajeOriginal);
  }
  
}