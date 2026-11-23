import { PartialType } from '@nestjs/mapped-types';
import { CreateIaDto } from './create-ia.dto.js';

export class UpdateIaDto extends PartialType(CreateIaDto) {}
