import { Equipo, Categoria, Maquina, Aditamento } from '@prisma/client';

export class CatalogoEquipoEntity implements Equipo {
    id: number;
    codigo_interno: string;
    marca: string | null;
    estado: string;
    ubicacion: string | null;
    descripcion: string | null;
    activo: boolean;
    id_categoria: number;

    categoria?: Categoria;
    maquina?: Maquina | null;
    aditamento?: Aditamento | null;

}
