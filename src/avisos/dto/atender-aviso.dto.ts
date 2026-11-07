import { Transform } from "class-transformer";
import { IsNotEmpty, IsString, MaxLength } from "class-validator";


export class AtenderAvisoDto {

    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString({ message: 'La nota debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'La nota de atención es obligatoria' })
    @MaxLength(500, { message: 'La nota no puede superar los 500 caracteres' })
    nota!: string;
}