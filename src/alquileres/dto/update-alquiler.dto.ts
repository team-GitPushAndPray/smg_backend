import { Transform } from 'class-transformer';
import { IsDateString, IsDefined, IsNotEmpty, IsNumber, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { trimOrNull } from './create-alquileres.dto.js';

export class UpdateAlquilerDto {
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: 'fecha_fin_prevista debe tener un formato de fecha válido (YYYY-MM-DD)' },
  )
  fecha_fin_prevista?: string;

  @ValidateIf((o: UpdateAlquilerDto) => o.latitud !== undefined || o.longitud !== undefined)
  @IsDefined({ message: 'Si se envía longitud, la latitud también es obligatoria' })
  @IsNumber({}, { message: 'La latitud debe ser un número válido' })
  @Min(-90, { message: 'La latitud debe estar entre -90 y 90' })
  @Max(90, { message: 'La latitud debe estar entre -90 y 90' })
  latitud?: number;

  @ValidateIf((o: UpdateAlquilerDto) => o.latitud !== undefined || o.longitud !== undefined)
  @IsDefined({ message: 'Si se envía latitud, la longitud también es obligatoria' })
  @IsNumber({}, { message: 'La longitud debe ser un número válido' })
  @Min(-180, { message: 'La longitud debe estar entre -180 y 180' })
  @Max(180, { message: 'La longitud debe estar entre -180 y 180' })
  longitud?: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'ubicacion_referencia debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'ubicacion_referencia no puede estar vacía' })
  @MaxLength(255)
  ubicacion_referencia?: string;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(100)
  contacto_obra_nombre?: string | null;

  @IsOptional()
  @Transform(trimOrNull)
  @IsString()
  @MaxLength(50)
  contacto_obra_telefono?: string | null;
  
}