import { Transform } from "class-transformer";
import { IsBoolean, IsOptional, IsString } from "class-validator";

export class GetClientesQueryDto {

    @IsOptional()
    @IsString()
    @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
    q?: string;

    @IsOptional()
    @Transform(({ value }) => {
        if (value === 'true' || value == true) return true;
        if (value === 'false' || value == false) return false;
        return value
    })
    @IsBoolean({ message: ' El parámetro activo debe ser un valor booleano (true o false' })
    activo?: boolean;

}