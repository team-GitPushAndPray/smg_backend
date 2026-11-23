import type { ContentListUnion, Schema } from "@google/genai";

export interface VacanteParaAnalisis {
    titulo: string;
    descripcion: string;
    requisitos: string;
}

export interface AnalizarCVParams {
    pdf: Buffer;
    vacante: VacanteParaAnalisis;
}

export interface ResultadoAnalisisCV {
    puntaje: number;
    resumen_experiencia: string;
    justificacion: string;
    modelo: string;
    version_prompt: string;
}

export interface GenerarJsonParams {
    systemInstruction: string;
    contenido: ContentListUnion;
    schema: Schema;
}

export interface GenerarJsonResultado<T> {
    data: T;
    modelo: string;
}

export interface CandidatoParaResumen {
  postulacion_id: number;
  nombre: string;
  puntaje: number;
  resumen_experiencia: string;
  justificacion: string;
}

export interface ResumirVacanteParams {
  vacante: VacanteParaAnalisis;
  candidatos: CandidatoParaResumen[];
}

export interface TopCandidatoIA {
  posicion: number;
  postulacion_id: number;
  motivo: string;
}

export interface ResultadoResumenVacante {
  top: TopCandidatoIA[];
  comparacion: string;
  recomendacion: string;
  modelo: string;
  version_prompt: string;
}

export interface RespuestaAnalisisRaw {
  puntaje: unknown;
  resumen_experiencia: unknown;
  justificacion: unknown;
}

export interface RespuestaResumenRaw {
  top: unknown;
  comparacion: unknown;
  recomendacion: unknown;
}