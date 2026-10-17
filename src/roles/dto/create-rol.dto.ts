import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateRolDto {

    @IsString()
    @IsNotEmpty({ message: 'El nombre del rol es obligatorio' })
    @MaxLength(50)
    nombre: string;

    @IsString()
    @IsOptional()
    descripcion?: string;
}