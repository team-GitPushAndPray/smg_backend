import { TipoEquipo } from '../dto/filtro-equipos.dto.js';

export interface EquipoConRelacionesPrisma {

    id: number;
    codigo_interno: string;
    qr_token: string;
    marca: string;
    estado: string;
    descripcion?: string | null;
    ubicacion?: string | null;
    activo: boolean;
    categoria: {
        id: number;
        nombre: string;
        descripcion?: string | null;
    };
    maquina?: {
        modelo: string;
        anio: number;
        n_serie: string;
        horas_motor_actual: number;
        horas_actualizadas_en: Date | null;
    } | null;
    aditamento?: Record<string, any> | null;
}

// Entidad para el listado paginado: GET /api/equipos
export class EquipoListItemEntity {

    id: number;
    codigoInterno: string;
    tipo: TipoEquipo;
    nombre: string;
    marca: string;
    modelo: string | null;
    categoria: {
        id: number;
        nombre: string;
    };
    estado: string;
    horasMotorActual: number | null;
    horasActualizadasEn: Date | null;

    constructor(equipo: EquipoConRelacionesPrisma) {
        const esMaquina = Boolean(equipo.maquina);

        this.id = equipo.id;
        this.codigoInterno = equipo.codigo_interno;
        this.tipo = esMaquina ? 'maquina': 'aditamento';
        this.nombre = equipo.categoria.nombre;
        this.marca = equipo.marca;
        this.modelo = esMaquina ? equipo.maquina!.modelo : null;
        this.categoria = {
            id: equipo.categoria.id,
            nombre: equipo.categoria.nombre,
        };
        this.estado = equipo.estado;
        this.horasMotorActual = esMaquina ? equipo.maquina!.horas_motor_actual : null;
        this.horasActualizadasEn = esMaquina ? equipo.maquina!.horas_actualizadas_en : null;
    }
  
}

// Entidad para el detalle: GET /api/equipos/:id

export class EquipoDetalleEntity extends EquipoListItemEntity {

    qr_token: string;
    descripcion: string | null;
    ubicacion: string | null;
    activo: boolean;
    anio?: number | null;
    nSerie?: string | null;

    constructor(equipo: EquipoConRelacionesPrisma) {
        super(equipo);

        this.qr_token = equipo.qr_token;
        this.descripcion = equipo.descripcion ?? null;
        this.ubicacion = equipo.ubicacion ?? null;
        this.activo = equipo.activo;

        if (equipo.maquina) {
            this.anio = equipo.maquina.anio;
            this.nSerie = equipo.maquina.n_serie;
        }
    }
}