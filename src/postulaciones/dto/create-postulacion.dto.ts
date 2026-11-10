import { Transform } from "class-transformer";
import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min } from "class-validator";


const trimString = ({ value }: { value: unknown }): unknown => typeof value === 'string' ? value.trim() : value;

const trimOptionalString = ({ value }: { value: unknown }): unknown => {
    if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed === '' ? undefined : trimmed;
    }
    return value;
};

const toInt = ({ value }: { value: unknown }): unknown => {
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value.trim());
        return Number.isNaN(parsed) ? value : parsed;
    }
    return value;
}


export class CreatePostulacionDto {

    @Transform(toInt)
    @IsInt({ message: 'El campo vacante_id debe ser un número entero válido' })
    @Min(1, { message: 'El campo vacante_id debe ser mayor a 0' })
    vacante_id!: number;

    @Transform(trimString)
    @IsString({ message: 'El nombre debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El nombre es obligatorio y no puede estar vacío' })
    @MaxLength(100, { message: 'El nombre no puede superar los 100 caracteres' })
    nombre!: string;

    @Transform(trimString)
    @IsString({ message: 'El apellido debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El apellido es obligatorio y no puede estar vacío' })
    @MaxLength(100, { message: 'El apellido no puede superar los 100 caracteres' })
    apellido!: string;

    @Transform(({ value }: { value: unknown }) =>
        typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    @IsNotEmpty({ message: 'El email es obligatorio' })
    @IsEmail({}, { message: 'El email debe tener un formato válido' })
    @MaxLength(150, { message: 'El email no puede superar los 150 caracteres' })
    email!: string;

    @Transform(trimString)
    @IsString({ message: 'El teléfono debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'El teléfono es obligatorio y no puede estar vacío' })
    @MaxLength(40, { message: 'El teléfono no puede superar los 40 caracteres' })
    telefono!: string;

    @IsOptional()
    @Transform(trimOptionalString)
    @IsString({ message: 'El mensaje debe ser una cadena de texto' })
    @MaxLength(1500, { message: 'El mensaje no puede superar los 1500 caracteres' })
    mensaje?: string;

    // anti-spam
    @IsOptional()
    @Transform(trimOptionalString)
    @IsString()
    @MaxLength(255)
    website?: string;

}