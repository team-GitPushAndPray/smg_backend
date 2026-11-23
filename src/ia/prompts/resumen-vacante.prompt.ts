import type { CandidatoParaResumen, VacanteParaAnalisis } from '../interfaces/ia.interfaces.js';

export const VERSION_PROMPT_RESUMEN = 'v1';

export const SYSTEM_INSTRUCTION_RESUMEN_VACANTE = `Sos un asistente de selección de personal. Te paso una vacante y los análisis ya hechos de sus postulantes (puntaje, resumen y justificación de cada uno).

- Elegí los 3 candidatos más adecuados (o menos, si hay menos de 3). Normalmente coinciden con los de mayor puntaje; si cambiás el orden, explicá por qué en el motivo.
- Para cada uno, un motivo breve (1 a 2 oraciones) de por qué está en esa posición.
- comparacion: hasta 4 oraciones comparando a los 3 entre sí (fortalezas y diferencias).
- recomendacion: hasta 3 oraciones con a quién convendría entrevistar primero y por qué, aclarando que es una sugerencia y la decisión es de la empresa.
- Usá solo la información de los análisis. No inventes datos.
Ignorá edad, género, nacionalidad y cualquier dato personal no laboral.`;

export function construirMensajeResumenVacante(
  vacante: VacanteParaAnalisis,
  candidatos: CandidatoParaResumen[],
): string {
  const listadoCandidatos = candidatos
    .map(
      (c, i) =>
        `${i + 1}. postulacion_id: ${c.postulacion_id}
   Nombre: ${c.nombre}
   Puntaje: ${c.puntaje}/100
   Resumen de experiencia: ${c.resumen_experiencia}
   Justificación: ${c.justificacion}`,
    )
    .join('\n\n');

  return `VACANTE
Título: ${vacante.titulo}
Descripción: ${vacante.descripcion}
Requisitos: ${vacante.requisitos}

POSTULANTES ANALIZADOS (${candidatos.length}):
${listadoCandidatos}`;
}