import { EstadoItem, TipoChecklist } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsEnum, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, Length, MaxLength, Min, ValidateNested } from "class-validator";

export class ChecklistRespuestaItemDto {
    @IsInt({ message: 'El plantilla_item_id debe ser un número entero' })
    @IsPositive({ message: 'El plantilla_item_id debe ser un número positivo' })
    plantilla_item_id: number;

    @IsEnum(EstadoItem, { message: 'El estado de cada respuesta debe ser NORMAL, ANORMAL o NO_APLICA' })
    estado: EstadoItem;
}


export class CrearChecklistDto {
  @IsEnum(TipoChecklist, {
    message:
      'El tipo de checklist no es válido. Valores permitidos: DIARIO, MANTENIMIENTO, ENTREGA, DEVOLUCION',
  })
  tipo: TipoChecklist;

  @IsOptional()
  @IsInt({ message: 'Las horas de motor deben ser un número entero' })
  @Min(0, { message: 'Las horas de motor no pueden ser negativas' })
  horas_motor?: number | null;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El nombre del responsable es obligatorio' })
  @IsNotEmpty({ message: 'El nombre del responsable es obligatorio' })
  @Length(2, 60, {
    message: 'El nombre del responsable debe tener entre 2 y 60 caracteres',
  })
  responsable_nombre: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El apellido del responsable es obligatorio' })
  @IsNotEmpty({ message: 'El apellido del responsable es obligatorio' })
  @Length(2, 60, {
    message: 'El apellido del responsable debe tener entre 2 y 60 caracteres',
  })
  responsable_apellido: string;

  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const limpio = value.trim();
    return limpio.length === 0 ? null : limpio;
  })
  @IsString({ message: 'Las observaciones deben ser una cadena de texto' })
  @MaxLength(1000, {
    message: 'Las observaciones no pueden superar los 1000 caracteres',
  })
  observaciones?: string | null;

  @IsArray({ message: 'El campo respuestas debe ser un arreglo' })
  @ArrayNotEmpty({ message: 'Debe enviar al menos una respuesta en el checklist' })
  @ValidateNested({ each: true })
  @Type(() => ChecklistRespuestaItemDto)
  respuestas: ChecklistRespuestaItemDto[];
}
