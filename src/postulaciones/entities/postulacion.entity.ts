import { EstadoPostulacion, Postulacion } from '@prisma/client';

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

export type PostulacionAdminProps = Postulacion & {
  vacante?: VacanteResumenProps;
};

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
      this.vacante = partial.vacante;
    }
  }
}