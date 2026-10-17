import { PartialType } from '@nestjs/mapped-types';
import { CreateRolDto } from './create-rol.dto.js';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateRolDto extends PartialType(CreateRolDto) {
    
    @IsString()
    @IsOptional()
    @MaxLength(50)
    nombre?: string;

    @IsString()
    @IsOptional()
    descripcion?: string;

    @IsBoolean()
    @IsOptional()
    activo?: boolean;
}
