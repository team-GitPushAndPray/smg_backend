import { PartialType } from '@nestjs/mapped-types';
import { CreateVacanteDto } from './create-vacante.dto.js';

export class UpdateVacanteDto extends PartialType(CreateVacanteDto) {}
