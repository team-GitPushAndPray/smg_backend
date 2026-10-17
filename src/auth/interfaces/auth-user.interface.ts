export interface AuthUser {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    rol: {
        id: number;
        nombre: string;
    };
    modulos: string[];
}
