import { IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { EstadoEquipo } from '@prisma/client';
import { PaginationDto } from '../../common/dto/pagination.dto.js';

export const TIPOS_EQUIPO = ['maquina', 'aditamento'] as const;
export type TipoEquipo = (typeof TIPOS_EQUIPO)[number];
export { EstadoEquipo };

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
  @IsEnum(EstadoEquipo, {
    message: `Estado inválido. Valores permitidos: ${Object.values(EstadoEquipo).join(', ')}`,
  })
  estado?: EstadoEquipo;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoriaId?: number;

  @IsOptional()
  @Transform(({ obj, key }) => {
    const rawValue = obj[key];
    if (rawValue === 'true' || rawValue === true) return true;
    if (rawValue === 'false' || rawValue === false) return false;
    return undefined;
  })
  @IsBoolean({ message: 'activo debe ser un valor booleano (true o false)' })
  activo?: boolean;

}