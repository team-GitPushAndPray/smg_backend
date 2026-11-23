import { BadGatewayException, GatewayTimeoutException, HttpException, HttpStatus, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { GoogleGenAI, Type, type Schema } from '@google/genai';
import { AnalizarCVParams, GenerarJsonParams, GenerarJsonResultado, ResultadoAnalisisCV } from './interfaces/ia.interfaces.js';
import { construirMensajeVacante, SYSTEM_INSTRUCTION_ANALISIS_CV, VERSION_PROMPT_ANALISIS } from './prompts/analisis-cv.prompt.js';

const TIMEOUT_MS = 25_000;
const MODELO_DEFAULT = 'gemini-3.5-flash-lite';

interface RespuestaAnalisisRaw {
  puntaje: unknown;
  resumen_experiencia: unknown;
  justificacion: unknown;
}

const SCHEMA_ANALISIS_CV: Schema = {
  type: Type.OBJECT,
  properties: {
    puntaje: {
      type: Type.INTEGER,
      description: 'Puntaje entero de afinidad entre 0 y 100.',
    },
    resumen_experiencia: {
      type: Type.STRING,
      description:
        'Hasta 3 oraciones con la experiencia y formación relevantes detectadas.',
    },
    justificacion: {
      type: Type.STRING,
      description:
        'Hasta 3 oraciones explicando el puntaje: qué requisitos cumple y cuáles no.',
    },
  },
  required: ['puntaje', 'resumen_experiencia', 'justificacion'],
};





@Injectable()
export class GeminiService {
  private readonly logger = new Logger(GeminiService.name);
  private readonly ai: GoogleGenAI | null;
  private readonly modelo: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    this.modelo = process.env.GEMINI_MODEL?.trim() || MODELO_DEFAULT;

    if (!apiKey) {
      this.ai = null;
      this.logger.warn(
        'GEMINI_API_KEY no configurada. La app inicia sin funcionalidad de IA.',
      );

      return;
    }

    this.ai = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: TIMEOUT_MS },
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
    const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

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

    const mensajeOriginal = err?.message || 'Error desconocido al consultar la IA';
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