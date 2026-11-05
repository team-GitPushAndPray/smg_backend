import { Equipo, Categoria, Maquina, Aditamento, EstadoEquipo } from '@prisma/client';

export class CatalogoEquipoEntity implements Omit<Equipo, 'qr_token'> {
    
    id: number;
    codigo_interno: string;
    marca: string | null;
    estado: EstadoEquipo;
    ubicacion: string | null;
    descripcion: string | null;
    activo: boolean;
    id_categoria: number;

    categoria?: Categoria;
    maquina?: Maquina | null;
    aditamento?: Aditamento | null;
    
}