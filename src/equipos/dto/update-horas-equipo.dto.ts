import { IsInt, Min } from "class-validator";

export class UpdateHorasEquipoDto {
    @IsInt({ message: 'horasMotorActual debe ser un número entero' })
    @Min(0, { message: 'horasMotorActual no puede ser un valor negativo' })
    horasMotorActual: number;
}
