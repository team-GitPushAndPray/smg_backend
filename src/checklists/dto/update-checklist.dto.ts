import { PartialType } from '@nestjs/mapped-types';
import { CrearChecklistDto } from './create-checklist.dto.js';

export class UpdateChecklistDto extends PartialType(CrearChecklistDto) {}
