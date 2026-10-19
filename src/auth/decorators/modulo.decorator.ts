import { SetMetadata, CustomDecorator } from '@nestjs/common';

export const MODULO_KEY = 'modulo_requerido';

export interface ModuloOpciones {
  editar?: boolean;
}

export interface ModuloMetadata {
  codigo: string;
  editar: boolean;
}

export const Modulo = (codigo: string, opciones?: ModuloOpciones): CustomDecorator => {
  return SetMetadata(MODULO_KEY, {
    codigo: codigo.toUpperCase(),
    editar: opciones?.editar ?? false,
  } as ModuloMetadata);
};