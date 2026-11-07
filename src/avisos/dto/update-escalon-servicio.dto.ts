import { Transform } from "class-transformer";
import { Allow, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";


export class UpdateEscalonServicioDto {
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value ))
    @IsString({ message: 'La descripción debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La descripción no puede estar vacía' })
    @MaxLength(500, { message: 'La descripción no puede superar los 500 caracteres' })
    descripcion!: string;

    @IsOptional()
    @Allow()
    horas_intervalo?: unknown; 

    @IsOptional()
    @Allow()
    nombre?: unknown; 
}