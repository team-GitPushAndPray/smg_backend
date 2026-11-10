import { EstadoPostulacion, Postulacion } from "@prisma/client";

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

/**
 * POST /api/postulaciones
 * No expone cv_url por seguridad al tratarse de un endpoint público
 */
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