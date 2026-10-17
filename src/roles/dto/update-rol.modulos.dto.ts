import { IsArray, IsString } from 'class-validator';

export class UpdateRolModulosDto {
    
    @IsArray({ message: 'modulos debe ser un arreglo de string' })
    @IsString({ each: true, message: 'Cada código de módulo debe ser un string' })
    modulos: string[];
}