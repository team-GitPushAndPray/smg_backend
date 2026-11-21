import { CanalNotificacion } from '@prisma/client';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class PruebaNotificacionDto {
  @IsEnum(CanalNotificacion, {
    message: 'El canal debe ser TELEGRAM o EMAIL',
  })
  canal: CanalNotificacion;

  @IsString({ message: 'El destino debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El destino es obligatorio' })
  destino: string;
}