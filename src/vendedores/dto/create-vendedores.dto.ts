import { IsEnum, IsNotEmpty, IsOptional, IsString, IsUrl, MaxLength } from 'class-validator';
import { CargoVendedor } from '@prisma/client';

export class CreateVendedoresDto {
    @IsString({ message: 'El nombre debe ser un texto válido' })
    @IsNotEmpty({ message: 'El nombre es obligatorio' })
    nombre: string;

    @IsEnum(CargoVendedor, { message: 'El cargo debe ser LOGISTICA, VENTAS, ALQUILERES o REPUESTOS' })
    cargo: CargoVendedor;

    @IsString()
    @IsOptional()
    @MaxLength(255, { message: 'La descripción no puede superar los 255 caracteres' })
    descripcion?: string;

    @IsUrl({}, { message: 'La foto debe ser una URL válida' })
    @IsOptional()
    foto?: string;

    @IsString()
    @IsNotEmpty({ message: 'El número de contacto es obligatorio' })
    contacto: string;

}
