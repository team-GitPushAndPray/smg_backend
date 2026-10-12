import { IsOptional, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";


export class FiltroCatalogoDto {
    
    @IsOptional()
    @Type(() => Number)
    @IsInt({ message: 'El id de la categoría debe ser un número entero válido' })
    @Min(1, { message: 'El id de la categoría debe ser mayor a 0' })
    categoriaId?: number;
}
