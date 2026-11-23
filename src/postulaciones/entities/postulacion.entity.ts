import { EstadoAnalisis, EstadoPostulacion, Postulacion } from '@prisma/client';

export type PostulacionPublicaProps = Pick<
  Postulacion,
  | 'id'
  | 'vacante_id'
  | 'nombre'
  | 'apellido'
  | 'email'
  | 'telefono'
  | 'mensaje'
  | 'cv_nombre_original'
  | 'estado'
  | 'creado_en'
>;

export interface VacanteResumenProps {
  id: number;
  titulo: string;
  activa?: boolean;
}

export interface VacanteConRequisitosProps extends VacanteResumenProps {
  requisitos_actualizados_en?: Date | null;
}

export interface AnalisisRawProps {
  estado: EstadoAnalisis;
  puntaje: number | null;
  resumen_experiencia: string | null;
  justificacion: string | null;
  error_detalle: string | null;
  modelo: string | null;
  analizado_en: Date | null;
}

export interface AnalisisAdminView extends AnalisisRawProps {
  desactualizado: boolean;
}

export type PostulacionAdminProps = Postulacion & {
  vacante?: VacanteConRequisitosProps;
  analisis?: AnalisisRawProps | null;
  posicion?: number | null;
};

export function mapearAnalisisAdmin(
  analisis: AnalisisRawProps | null | undefined,
  requisitosActualizadosEn?: Date | null,
): AnalisisAdminView | null {
  if (!analisis) return null;

  const desactualizado = Boolean(
    analisis.analizado_en &&
      requisitosActualizadosEn &&
      analisis.analizado_en.getTime() < requisitosActualizadosEn.getTime(),
  );

  return {
    estado: analisis.estado,
    puntaje: analisis.puntaje,
    resumen_experiencia: analisis.resumen_experiencia,
    justificacion: analisis.justificacion,
    error_detalle: analisis.error_detalle,
    modelo: analisis.modelo,
    analizado_en: analisis.analizado_en,
    desactualizado,
  };
}

export class PostulacionPublicaEntity {
  id: number;
  vacante_id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  mensaje: string | null;
  cv_nombre_original: string;
  estado: EstadoPostulacion;
  creado_en: Date;

  constructor(partial: PostulacionPublicaProps) {
    this.id = partial.id;
    this.vacante_id = partial.vacante_id;
    this.nombre = partial.nombre;
    this.apellido = partial.apellido;
    this.email = partial.email;
    this.telefono = partial.telefono;
    this.mensaje = partial.mensaje;
    this.cv_nombre_original = partial.cv_nombre_original;
    this.estado = partial.estado;
    this.creado_en = partial.creado_en;
  }
}

export class PostulacionAdminEntity {
  id: number;
  vacante_id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  mensaje: string | null;
  cv_url: string;
  cv_nombre_original: string;
  estado: EstadoPostulacion;
  creado_en: Date;
  actualizado_en: Date;
  vacante?: VacanteResumenProps;
  analisis: AnalisisAdminView | null;
  posicion?: number | null;

  constructor(partial: PostulacionAdminProps) {
    this.id = partial.id;
    this.vacante_id = partial.vacante_id;
    this.nombre = partial.nombre;
    this.apellido = partial.apellido;
    this.email = partial.email;
    this.telefono = partial.telefono;
    this.mensaje = partial.mensaje;
    this.cv_url = partial.cv_url;
    this.cv_nombre_original = partial.cv_nombre_original;
    this.estado = partial.estado;
    this.creado_en = partial.creado_en;
    this.actualizado_en = partial.actualizado_en;

    if (partial.vacante) {
      this.vacante = {
        id: partial.vacante.id,
        titulo: partial.vacante.titulo,
        ...(partial.vacante.activa !== undefined
          ? { activa: partial.vacante.activa }
          : {}),
      };
    }

    this.analisis = mapearAnalisisAdmin(
      partial.analisis,
      partial.vacante?.requisitos_actualizados_en,
    );

    if (partial.posicion !== undefined) {
      this.posicion = partial.posicion;
    }
  }
}