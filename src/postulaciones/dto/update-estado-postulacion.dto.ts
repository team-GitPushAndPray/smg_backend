import { EstadoPostulacion } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateEstadoPostulacionDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @IsEnum(EstadoPostulacion, {
    message: `El estado debe ser uno de los siguientes valores: ${Object.values(EstadoPostulacion).join(', ')}`,
  })
  estado!: EstadoPostulacion;
}