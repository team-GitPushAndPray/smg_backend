export interface TopCandidatoResumenView {
  posicion: number;
  postulacion_id: number;
  nombre: string;
  puntaje: number | null;
  motivo: string;
}

export interface ResumenVacanteProps {
  vacante_id: number;
  top: TopCandidatoResumenView[];
  comparacion: string;
  recomendacion: string;
  cantidad_analizadas: number;
  modelo: string;
  generado_en: Date;
  desactualizado: boolean;
}

export class ResumenVacanteEntity {
  vacante_id: number;
  top: TopCandidatoResumenView[];
  comparacion: string;
  recomendacion: string;
  cantidad_analizadas: number;
  modelo: string;
  generado_en: Date;
  desactualizado: boolean;

  constructor(props: ResumenVacanteProps) {
    this.vacante_id = props.vacante_id;
    this.top = props.top;
    this.comparacion = props.comparacion;
    this.recomendacion = props.recomendacion;
    this.cantidad_analizadas = props.cantidad_analizadas;
    this.modelo = props.modelo;
    this.generado_en = props.generado_en;
    this.desactualizado = props.desactualizado;
  }
}