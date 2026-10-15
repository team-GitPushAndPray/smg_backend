import { PartialType } from '@nestjs/mapped-types';
import { CreateEquipoDto } from './create-equipo.dto.js';

export class UpdateEquipoDto extends PartialType(CreateEquipoDto) {}
