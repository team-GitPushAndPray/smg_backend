import { CanalNotificacion } from "@prisma/client";

export interface Notificador {
    readonly canal: CanalNotificacion;
    enviar(destino: string, mensaje: string): Promise <void>;
}