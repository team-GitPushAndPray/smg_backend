import { PartialType } from '@nestjs/mapped-types';
import { CreateUsuarioDto } from './create-usuario.dto.js';
import { IsEmail, IsInt, IsOptional, IsPositive, IsString } from 'class-validator';

export class UpdateUsuarioDto extends PartialType(CreateUsuarioDto) {

    @IsString()
    @IsOptional()
    nombre?: string;

    @IsString()
    @IsOptional()
    apellido?: string;

    @IsEmail({}, { message: 'El formato del email no es válido' })
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    telefono?: string;

    @IsInt({ message: 'rolId debe ser un número entero' })
    @IsPositive()
    @IsOptional()
    rolId?: number;
}
