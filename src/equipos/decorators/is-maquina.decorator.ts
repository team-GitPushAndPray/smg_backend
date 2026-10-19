import { applyDecorators } from '@nestjs/common';
import { ValidateIf, IsNotEmpty } from 'class-validator';

export function IsMaquina() {
  return applyDecorators(
    ValidateIf((o: { tipo: string }) => o.tipo === 'maquina'),
    IsNotEmpty({ message: 'Este campo es obligatorio para máquinas' }),
  );
}