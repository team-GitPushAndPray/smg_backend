import { EstadoAlquiler } from "@prisma/client";
import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsEnum, IsInt, IsOptional, IsPositive } from 'class-validator';

export class GetAlquileresQueryDto {

    @IsOptional()
    @Transform(({ value }) => {
        if (typeof value === 'string') {
            return value
                .split(',')
                .map((v) => v.trim().toUpperCase())
                .filter((v) => v.length > 0);
        }
        if (Array.isArray(value)) {
            return value.map((v) => String(v).trim().toUpperCase());
        }
        return value;
    })
    @IsArray()
    @IsEnum(EstadoAlquiler, {
        each: true,
        message: `Cada estado debe ser uno de los siguientes valores: ${Object.values(EstadoAlquiler).join(', ')}`,
    })
    estado?: EstadoAlquiler[];

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'cliente_id debe ser un número entero' })
    @IsPositive({ message: 'cliente_id debe ser un número positivo' })
    cliente_id?: number;

    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'equipo_id debe ser un número entero' })
    @IsPositive({ message: 'equipo_id debe ser un número positivo' })
    equipo_id?: number;
    
    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value === true) return true;
        if (value === 'false' || value === false) return false;
        return value;
    })
    @IsBoolean({ message: 'El parámetro por_vencer debe ser un valor booleano (true o false)' })
    por_vencer?: boolean;

}