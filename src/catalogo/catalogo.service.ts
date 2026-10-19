import { Injectable, NotFoundException } from '@nestjs/common';
import { EquiposService } from '../equipos/equipos.service.js';
import { FiltroCatalogoDto } from './dto/filtro-catalogo.dto.js';


@Injectable()
export class CatalogoService {

  constructor(private equiposService: EquiposService) {}

  async findAll(filtros: FiltroCatalogoDto) {
    const { categoriaId } = filtros;
    const extraWhere = categoriaId ? { id_categoria: categoriaId } : {};

    return this.equiposService.findManyCatalogo(extraWhere);
  }


  async findOne(id: number) {

    try {
      return await this.equiposService.findOneCatalogo(id);
    } catch (error) {
      throw new NotFoundException(`El equipo #${id} no existe o no se encuentra disponible en el catálogo en este momento.`);
    }
  }
}
