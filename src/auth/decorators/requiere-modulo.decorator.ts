import { SetMetadata } from "@nestjs/common";

export const META_MODULOS = 'modulos';

export const RequiereModulo = (...modulos: string[]) => SetMetadata(META_MODULOS, modulos);