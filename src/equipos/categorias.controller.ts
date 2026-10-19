import { Controller, Get } from "@nestjs/common";
import { EquiposService } from "./equipos.service.js";
import { Modulo } from "../auth/decorators/modulo.decorator.js";


@Modulo('MAQUINAS')
@Controller('categorias')
export class CategoriasController {
    constructor(private readonly equiposService: EquiposService) {}

    @Get()
    findAll() {
        return this.equiposService.findAllCategorias();
    }
}
