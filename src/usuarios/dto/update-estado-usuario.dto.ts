import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateEstadoUsuarioDto {

    @IsBoolean({ message: 'El campo activo debe ser un valor booleano' })
    @IsNotEmpty()
    activo: boolean;
}