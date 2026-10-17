export class RolEntity {
    id: number;
    nombre: string;
    descripcion: string | null;
    activo: boolean;
    esSistema: boolean;
    modulos: string[];

    constructor(partial: any) {
        this.id = partial.id;
        this.nombre = partial.nombre;
        this.descripcion = partial.descripcion ?? null;
        this.activo = partial.activo;
        this.esSistema = partial.es_sistema ?? partial.esSistema ?? false;
        this.modulos = Array.isArray(partial.modulos)
            ? partial.modulos.map((rm: any) => rm.modulo.codigo)
            : [];
    }

    static fromPrisma(rol: any): RolEntity {
        return new RolEntity(rol);
    }
}
