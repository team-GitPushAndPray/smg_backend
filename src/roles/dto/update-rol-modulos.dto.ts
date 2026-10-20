import { Transform, Type } from 'class-transformer';
import { IsArray, IsBoolean, IsNotEmpty, IsString, ValidateNested } from 'class-validator';


export class ModuloPermisoItemDto {
    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toUpperCase() : value
    )
    @IsString({ message: 'El código del módulo debe ser un texto' })
    @IsNotEmpty({ message: 'El código del módulo es obligatorio' })
    codigo: string;

    @IsBoolean({ message: 'puedeEditar debe ser un valor booleano (true o false)' })
    puedeEditar: boolean;
}

export class UpdateRolModulosDto {
    @IsArray({ message: 'modulos debe ser un arreglo' })
    @ValidateNested({
        each: true,
        message: 'Cada elemento de modulos debe tener codigo y puedeEditar válidos',
    })
    @Type(() => ModuloPermisoItemDto)
    modulos: ModuloPermisoItemDto[];
}