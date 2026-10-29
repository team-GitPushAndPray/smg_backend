import { PartialType } from '@nestjs/mapped-types';
import { CreateChecklistDto } from './create-checklist.dto.js';

export class UpdateChecklistDto extends PartialType(CreateChecklistDto) {}
