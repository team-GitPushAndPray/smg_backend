import { IsIn, IsString } from "class-validator";

export const ESTADOS_EQUIPO = [
    'disponible',
    'alquilado',
    'en_taller',
    'fuera_de_servicio',
] as const;

export type EstadoEquipo = (typeof ESTADOS_EQUIPO)[number];

export class UpdateEstadoEquipoDto {
  @IsString({ message: 'El estado debe ser una cadena de texto' })
  @IsIn(ESTADOS_EQUIPO, {
    message: `El estado debe ser uno de los siguientes valores: ${ESTADOS_EQUIPO.join(', ')}`,
  })
  estado: EstadoEquipo;
}