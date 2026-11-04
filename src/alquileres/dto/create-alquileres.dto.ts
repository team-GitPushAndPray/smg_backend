import { Transform, Type } from "class-transformer";
import { ArrayMinSize, ArrayUnique, IsArray, IsDateString, IsInt, IsNotEmpty, IsNumber, IsOptional, IsPositive, IsString, Max, MaxLength, Min, Validate, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";

const trimOrNull = ({ value }: { value: unknown }) => {
    if (value === null || value === undefined) return value;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

@ValidatorConstraint({ name: 'isEndDateValid', async: false })
export class IsEndDateValidConstraint implements ValidatorConstraintInterface {
    validate(fechaFinPrevista: string, args: ValidationArguments): boolean {
        const dto = args.object as CreateAlquilerDto;
        if (!fechaFinPrevista || !dto.fecha_inicio) return false;

        const inicio = new Date(dto.fecha_inicio);
        const fin = new Date(fechaFinPrevista);

        if (isNaN(inicio.getTime()) || isNaN(fin.getTime())) return false;
        return fin >= inicio;
    }

    defaultMessage(): string {
        return 'La fecha_fin_prevista debe ser igual o posterior a fecha_inicio';
    }
}

export class CreateAlquilerDto {

    @Type(() => Number)
    @IsInt({ message: 'cliente_id debe ser un número entero' })
    @IsPositive({ message: 'cliente_id debe ser un ID válido' })
    cliente_id: number;

    @IsArray({ message: 'equipo_ids debe ser un arreglo' })
    @ArrayMinSize(1, { message: 'Debe incluir al menos un equipo en equipo_ids' })
    @ArrayUnique({ message: 'No se permiten equipos repetidos en equipo_ids' })
    @Type(() => Number)
    @IsInt({ each: true, message: 'Cada elemento de equipo_ids debe ser un número entero' })
    @IsPositive({ each: true, message: 'Cada elemento de equipo_ids debe ser un ID positivo' })
    equipo_ids: number[];

    @IsDateString(
        { strict: true },
        { message: 'fecha_inicio debe tener un formato de fecha válido (YYYY-MM-DD' },
    )
    fecha_inicio: string;

    @IsDateString(
        { strict: true },
        { message: 'fecha_fin_prevista debe tener un formato de fecha válido (YYYY-MM-DD' },
    )
    @Validate(IsEndDateValidConstraint)
    fecha_fin_prevista: string;

    @Type(() => Number)
    @IsNumber({}, { message: 'La latitud debe ser un número válido' })
    @Min(-90, { message: 'La latitud debe estar entre -90 y 90' })
    @Max(90, { message: 'La latitud debe estar entre -90 y 90' })
    latitud: number;

    @Type(() => Number)
    @IsNumber({}, { message: 'La latitud debe ser un número válido' })
    @Min(-180, { message: 'La latitud debe estar entre -180 y 180' })
    @Max(180, { message: 'La latitud debe estar entre -180 y 180' })
    longitud: number;

    @Transform(({ value }) => (typeof value === 'string' ? value.trim(): value))
    @IsString({ message: 'ubicacion_referencia debe ser una cadena de texto' })
    @IsNotEmpty({ message: 'ubicacion_referencia es obligatoria' })
    @MaxLength(255)
    ubicacion_referencia: string;

    @IsOptional()
    @Transform(trimOrNull)
    @IsString()
    @MaxLength(100)
    contacto_obra_nombre?: string | null;

    @IsOptional()
    @Transform(trimOrNull)
    @IsString()
    @MaxLength(50)
    contacto_obra_telefono?: string | null;

    @IsOptional()
    @Transform(trimOrNull)
    @IsString()
    observaciones?: string | null;

}