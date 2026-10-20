export class ModuloEntity {
    id: number;
    codigo: string;
    nombre: string;

    constructor(partial: any) {
        this.id = partial.id;
        this.codigo = partial.codigo.trim().toUpperCase();
        this.nombre = partial.nombre;   
    }

    static fromPrisma(modulo: any): ModuloEntity {
        return new ModuloEntity(modulo);
    }
}
