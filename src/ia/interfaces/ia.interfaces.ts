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