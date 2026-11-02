import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { TipoChecklist } from '@prisma/client';

function isRealCalendarDate(dateStr: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false;
  const [year, month, day] = dateStr.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

// 1. Validador individual de existencia en calendario (ej. rechaza 2026-02-31)
@ValidatorConstraint({ name: 'IsCalendarDate', async: false })
export class IsCalendarDateConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return true;
    return isRealCalendarDate(value);
  }

  defaultMessage(args: ValidationArguments): string {
    return `El parámetro "${args.property}" debe ser una fecha válida del calendario (YYYY-MM-DD)`;
  }
}

// 2. Validador cruzado de rango (se evalúa una sola vez sobre "hasta")
@ValidatorConstraint({ name: 'IsAfterOrEqualDesde', async: false })
export class IsAfterOrEqualDesdeConstraint implements ValidatorConstraintInterface {
  validate(hasta: string, args: ValidationArguments): boolean {
    const obj = args.object as GetHistorialChecklistsQueryDto;
    if (!obj.desde || !hasta) return true;
    if (!isRealCalendarDate(obj.desde) || !isRealCalendarDate(hasta)) return true; // Deja que IsCalendarDate maneje el error de formato
    return obj.desde <= hasta;
  }

  defaultMessage(): string {
    return 'La fecha "desde" no puede ser posterior a la fecha "hasta"';
  }
}

export class GetHistorialChecklistsQueryDto {
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'El parámetro "desde" debe tener el formato YYYY-MM-DD',
  })
  @Validate(IsCalendarDateConstraint)
  desde?: string;

  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'El parámetro "hasta" debe tener el formato YYYY-MM-DD',
  })
  @Validate(IsCalendarDateConstraint)
  @Validate(IsAfterOrEqualDesdeConstraint) // Solo aquí se valida la comparación
  hasta?: string;

  @IsOptional()
  @IsEnum(TipoChecklist, {
    message: `El parámetro "tipo" debe ser uno de: ${Object.values(TipoChecklist).join(', ')}`,
  })
  tipo?: TipoChecklist;

  @IsOptional()
  @IsString()
  responsable?: string;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'page debe ser un número entero' })
  @Min(1, { message: 'page debe ser mayor o igual a 1' })
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser mayor o igual a 1' })
  @Max(100, { message: 'limit no puede superar los 100 registros' })
  limit: number = 20;
}