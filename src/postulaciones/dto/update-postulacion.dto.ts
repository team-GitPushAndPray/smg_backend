import { PartialType } from '@nestjs/mapped-types';
import { CreatePostulacionDto } from './create-postulacion.dto.js';

export class UpdatePostulacionDto extends PartialType(CreatePostulacionDto) {}
