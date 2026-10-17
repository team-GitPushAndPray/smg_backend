import { IsEmail, IsInt, IsNotEmpty, IsOptional, IsPositive, IsString, MinLength } from "class-validator";


export class CreateUsuarioDto {

    @IsString()
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    nombre: string;

    @IsString()
    @IsNotEmpty({ message: 'El apellido es obligatorio' })
    apellido: string;

    @IsEmail({}, { message: 'El formato del email no es válido' })
    @IsNotEmpty({ message: 'El email es obligatorio' })
    email: string;

    @IsString()
    @IsOptional()
    telefono?: string;

    @IsString()
    @IsNotEmpty()
    @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
    password: string;

    @IsInt({ message: 'rolId debe ser un número entero' })
    @IsPositive()
    rolId: number;
}
