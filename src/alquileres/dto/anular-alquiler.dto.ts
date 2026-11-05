import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class AnularAlquilerDto {
    
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El motivo de anulación es obligatorio y no puede estar vacío' })
  @MaxLength(500, { message: 'El motivo no puede exceder los 500 caracteres' })
  motivo: string;

}