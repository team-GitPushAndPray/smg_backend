import { IsIn, IsInt, IsNotEmpty, IsOptional, IsString, Max, Min, ValidateIf } from 'class-validator';
import { Transform } from 'class-transformer';
import { TIPOS_EQUIPO } from './filtro-equipos.dto.js';
import type { TipoEquipo } from './filtro-equipos.dto.js';
import { IsMaquina } from '../decorators/is-maquina.decorator.js';

const MAX_ANIO_PERMITIDO = new Date().getFullYear() + 1;

export class CreateEquipoDto {
    @IsNotEmpty({ message: 'El tipo es obligatorio' })
    @IsIn(TIPOS_EQUIPO, { message: 'El tipo debería ser maquina o aditamento' })
    tipo: TipoEquipo;

    @Transform(({ value }) =>
        typeof value === 'string' ? value.trim().toUpperCase() : value,
    )
    @IsString({ message: 'codigoInterno debe ser un texto' })
    @IsNotEmpty({ message: 'codigoInterno es obligatorio' })
    codigoInterno: string;

    @IsInt({ message: 'categoriaId debe ser un número entero ' })
    @Min(1, { message: 'categoriaId debe ser mayor a 0' })
    categoriaId: number;

    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString({ message: 'marca debe ser un texto' })
    @IsNotEmpty({ message: 'marca es obligatoria' })
    marca: string;

    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString({ message: 'ubicacion debe ser un texto' })
    ubicacion?: string;

    @IsOptional()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString({ message: 'descripcion debe ser un texto' })
    descripcion?: string;


    // CAMPOS EXCLUSIVOS DE MÁQUINA (obligatorios si tipo === 'maquina')
    @IsMaquina()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString({ message: 'modelo debe ser un texto' })
    @IsNotEmpty({ message: 'modelo es obligatorio para máquinas' })
    modelo?: string;

    @IsMaquina()
    @IsInt({ message: 'anio debe ser un número entero' })
    @Min(1950, { message: 'anio debe ser mayor o igual a 1950' })
    @Max(MAX_ANIO_PERMITIDO, { message: `anio no puede ser mayor a ${MAX_ANIO_PERMITIDO}` })
    anio?: number;

    @IsMaquina()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    @IsString({ message: 'nSerie debe ser un texto' })
    @IsNotEmpty({ message: 'nSerie es obligatorio para máquinas' })
    nSerie?: string;

    @IsMaquina()
    @IsInt({ message: 'horaMotorActual debe ser un número entero' })
    @Min(0, { message: 'horasMotorActual debe ser mayor o igual a 0' })
    horasMotorActual?: number;


}