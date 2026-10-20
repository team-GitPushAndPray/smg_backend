import { SetMetadata } from "@nestjs/common";

export const MODULO_KEY = 'modulo_requerido';

export interface ModuloOptions {
    editar ?: boolean;
}

export interface ModuloMetadata {
    codigo: string;
    editar: boolean;
}

// Decorador unificado de autorización por módulo
export const Modulo = (codigo: string, options?: ModuloOptions) => 
    SetMetadata<string, ModuloMetadata>(MODULO_KEY, {
        codigo: codigo.trim().toUpperCase(),
        editar: options?.editar ?? false,
    });