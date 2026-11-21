import { CanalNotificacion, EstadoEnvio } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export class FiltroRegistroNotificacionesDto {
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(EstadoEnvio, { message: 'estado debe ser ENVIADO o ERROR' })
  estado?: EstadoEnvio;

  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @IsEnum(CanalNotificacion, { message: 'canal debe ser TELEGRAM o EMAIL' })
  canal?: CanalNotificacion;

  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === undefined ? 1 : Number(value),
  )
  @IsInt({ message: 'page debe ser un número entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  page: number = 1;

  @IsOptional()
  @Transform(({ value }) =>
    value === '' || value === undefined ? 20 : Number(value),
  )
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(100, { message: 'limit no puede superar 100' })
  limit: number = 20;
}