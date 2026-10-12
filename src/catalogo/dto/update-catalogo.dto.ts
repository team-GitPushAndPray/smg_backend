import { PartialType } from '@nestjs/mapped-types';
import { FiltroCatalogoDto } from './filtro-catalogo.dto.js';

export class UpdateCatalogoDto extends PartialType(FiltroCatalogoDto) {}
