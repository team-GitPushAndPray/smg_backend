
export class RolModuloItemEntity {
    codigo: string;
    puedeEditar: boolean;
}


export class RolEntity {
    id: number;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    esSistema: boolean;
    modulos: RolModuloItemEntity[];

    constructor(partial: any) {
        this.id = partial.id;
        this.nombre = partial.nombre;
        this.descripcion = partial.descripcion ?? null;
        this.activo = partial.activo;
        this.esSistema = partial.es_sistema ?? partial.esSistema ?? false;

        this.modulos = Array.isArray(partial.modulos)
            ? partial.modulos.map((rm: any) => ({
                codigo: rm.modulo?.codigo?.toUpperCase(),
                puedeEditar: Boolean(rm.puede_editar ?? rm.puedeEditar ?? false),
            }))
            : [];
    }

    static fromPrisma(rol: any): RolEntity {
        return new RolEntity(rol);
    }
}
