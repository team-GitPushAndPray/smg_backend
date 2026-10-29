import { IsInt, IsNotEmpty, IsOptional, IsString, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';

const MAX_ANIO_PERMITIDO = new Date().getFullYear() + 1;

export class UpdateEquipoDto {

  @IsOptional()
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString({ message: 'codigoInterno debe ser un texto' })
  @IsNotEmpty({ message: 'codigoInterno no puede estar vacío' })
  codigoInterno?: string;

  @IsOptional()
  @Transform(() => undefined)
  qr_token?: never;

  @IsOptional()
  @IsInt({ message: 'categoriaId debe ser un número entero' })
  @Min(1, { message: 'categoriaId debe ser mayor a 0' })
  categoriaId?: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'marca debe ser un texto' })
  @IsNotEmpty({ message: 'marca no puede estar vacía' })
  marca?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'ubicacion debe ser un texto' })
  ubicacion?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'descripcion debe ser un texto' })
  descripcion?: string;


  // CAMPOS EDITABLES SOLO EN MÁQUINAS (El service verificará el subtipo)

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'modelo debe ser un texto' })
  @IsNotEmpty({ message: 'modelo no puede estar vacío' })
  modelo?: string;

  @IsOptional()
  @IsInt({ message: 'anio debe ser un número entero' })
  @Min(1950, { message: 'anio debe ser mayor o igual a 1950' })
  @Max(MAX_ANIO_PERMITIDO, {
    message: `anio no puede ser mayor a ${MAX_ANIO_PERMITIDO}`,
  })
  anio?: number;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'nSerie debe ser un texto' })
  @IsNotEmpty({ message: 'nSerie no puede estar vacío' })
  nSerie?: string;
}