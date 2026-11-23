import { Type, type Schema } from '@google/genai';

export const SCHEMA_ANALISIS_CV: Schema = {
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

export const SCHEMA_RESUMEN_VACANTE: Schema = {
  type: Type.OBJECT,
  properties: {
    top: {
      type: Type.ARRAY,
      description:
        'Lista de hasta 3 candidatos seleccionados ordenados por posición.',
      items: {
        type: Type.OBJECT,
        properties: {
          posicion: {
            type: Type.INTEGER,
            description: 'Posición en el ranking (1, 2 o 3).',
          },
          postulacion_id: {
            type: Type.INTEGER,
            description: 'ID exacto de la postulación enviada.',
          },
          motivo: {
            type: Type.STRING,
            description:
              'Motivo breve (1 a 2 oraciones) de por qué ocupa esa posición.',
          },
        },
        required: ['posicion', 'postulacion_id', 'motivo'],
      },
    },
    comparacion: {
      type: Type.STRING,
      description:
        'Hasta 4 oraciones comparando fortalezas y diferencias entre los seleccionados.',
    },
    recomendacion: {
      type: Type.STRING,
      description:
        'Hasta 3 oraciones sugiriendo a quién entrevistar primero, aclarando que la decisión es de la empresa.',
    },
  },
  required: ['top', 'comparacion', 'recomendacion'],
};