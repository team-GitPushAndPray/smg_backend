import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

const trimOrUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export class CreateClienteDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'La razón social debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'La razón social es obligatoria y no puede estar vacía' })
  @MaxLength(150)
  razon_social: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString({ message: 'El CUIT debe ser una cadena de texto' })
  @MaxLength(20)
  cuit?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsEmail({}, { message: 'El formato del email no es válido' })
  @MaxLength(150)
  email?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(50)
  telefono?: string;

  @IsOptional()
  @Transform(trimOrUndefined)
  @IsString()
  @MaxLength(255)
  direccion?: string;
}
