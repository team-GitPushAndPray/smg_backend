import { Transform, TransformFnParams } from "class-transformer";
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

const trimString = ({ value }: TransformFnParams): unknown => typeof value === 'string' ? value.trim() : value;

export class CreateVacanteDto {

    @Transform(trimString)
    @IsString({ message: 'El título debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El título es obligatorio y no puede estar vacío' })
    @MaxLength(150, { message: 'El título no puede superar los 150 caracteres' })
    titulo!: string;

    @Transform(trimString)
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La descripción es obligatorio y no puede estar vacía' })
    @MaxLength(2000, { message: 'La descripción no puede superar los 2000 caracteres' })
    descripcion!: string;

    @Transform(trimString)
  @IsString({ message: 'Los requisitos deben ser una cadena de texto' })
  @IsNotEmpty({
    message: 'Los requisitos son obligatorios y no pueden estar vacíos',
  })
  @MaxLength(3000, {
    message: 'Los requisitos no pueden superar los 3000 caracteres',
  })
  requisitos!: string;

  @IsOptional()
  @IsBoolean({ message: 'El campo activa debe ser un valor booleano' })
  activa?: boolean;

}
