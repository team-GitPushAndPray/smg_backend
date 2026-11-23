import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class PruebaIaDto {
  @Type(() => Number)
  @IsInt({ message: 'vacante_id debe ser un número entero' })
  @Min(1, { message: 'vacante_id debe ser mayor a 0' })
  vacante_id: number;
}