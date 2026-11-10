import { EstadoPostulacion } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';

const toOptionalInt = ({ value }: { value: unknown }): unknown => {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value === 'string') {
    const parsed = Number(value.trim());
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
};

const normalizeOptionalEnum = ({ value }: { value: unknown }): unknown => {
  if (typeof value === 'string') {
    const trimmed = value.trim().toUpperCase();
    return trimmed === '' ? undefined : trimmed;
  }
  return value;
};

export class FilterPostulacionesDto {
    
  @IsOptional()
  @Transform(toOptionalInt)
  @IsInt({ message: 'El filtro vacante_id debe ser un número entero válido' })
  @Min(1, { message: 'El filtro vacante_id debe ser mayor a 0' })
  vacante_id?: number;

  @IsOptional()
  @Transform(normalizeOptionalEnum)
  @IsEnum(EstadoPostulacion, {
    message: `El filtro estado debe ser uno de los siguientes valores: ${Object.values(EstadoPostulacion).join(', ')}`,
  })
  estado?: EstadoPostulacion;

}