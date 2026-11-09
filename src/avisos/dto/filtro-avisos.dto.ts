import { EstadoAviso, TipoAviso } from "@prisma/client";
import { IsEnum, IsOptional } from "class-validator";

export class FiltroAvisosDto {

    @IsOptional()
    @IsEnum(EstadoAviso, {
        message: 'El estado debe ser PENDIENTE o ATENDIDO',
    })
    estado?: EstadoAviso;

    @IsOptional()
    @IsEnum(TipoAviso, {
        message: 'El tipo debe ser SERVICIO o CERTIFICACION',
    })
    tipo?: TipoAviso;
    
}