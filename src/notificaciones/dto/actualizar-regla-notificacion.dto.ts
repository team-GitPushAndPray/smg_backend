import { CanalNotificacion, TipoAviso } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ActualizarReglaNotificacionDto {
  @IsOptional()
  @IsEnum(TipoAviso, {
    message: 'tipo_aviso debe ser SERVICIO o CERTIFICACION',
  })
  tipo_aviso?: TipoAviso;

  @IsOptional()
  @IsEnum(CanalNotificacion, {
    message: 'canal debe ser TELEGRAM o EMAIL',
  })
  canal?: CanalNotificacion;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'destino no puede estar vacío' })
  destino?: string;

  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @IsNotEmpty({ message: 'etiqueta no puede estar vacía' })
  @MaxLength(60, { message: 'etiqueta no puede superar los 60 caracteres' })
  etiqueta?: string;

  @IsOptional()
  @IsBoolean({ message: 'activo debe ser un booleano' })
  activo?: boolean;
}