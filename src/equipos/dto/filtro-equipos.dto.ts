import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export const TIPOS_EQUIPO = ['maquina', 'aditamento'] as const;
export type TipoEquipo = (typeof TIPOS_EQUIPO[number]);

export const ESTADOS_EQUIPO = [
    'disponible',
    'alquilado',
    'en_taller',
    'fuera_de_servicio',
] as const;

export type EstadoEquipo = (typeof ESTADOS_EQUIPO)[number];


export class FiltrosEquiposDto extends PaginationDto {

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsIn(TIPOS_EQUIPO, {
    message: 'El tipo debe ser maquina o aditamento',
  })
  tipo?: TipoEquipo;

  @IsOptional()
  @IsIn(ESTADOS_EQUIPO, {
    message: 'Estado inválido. Valores permitidos: disponible, alquilado, en_taller, fuera_de_servicio',
  })
  estado?: EstadoEquipo;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoriaId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean({ message: 'activo debe ser un valor booleano (true o false)' })
  activo?: boolean = true;

}
