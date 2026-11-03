import { IsEnum, IsNotEmpty } from 'class-validator';
import { EstadoEquipo } from '@prisma/client';

export { EstadoEquipo };

export class UpdateEstadoEquipoDto {
  @IsNotEmpty({ message: 'El estado es obligatorio' })
  @IsEnum(EstadoEquipo, {
    message: `El estado debe ser uno de: ${Object.values(EstadoEquipo).join(', ')}`,
  })
  estado: EstadoEquipo;
}