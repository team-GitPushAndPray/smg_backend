import { Usuario, Rol, Modulo, RolModulo } from '@prisma/client';

type UsuarioConRelaciones = Omit<Usuario, 'password'> & {
  password?: string;
  rol: (Rol & {
    modulos: (RolModulo & { modulo: Modulo } )[];
  }) | null;
};

export class UsuarioAuthEntity {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: {
    id: number;
    nombre: string;
  };
  modulos: Array<{
    codigo: string;
    puedeEditar: boolean;
  }>;

  constructor(usuario: UsuarioConRelaciones) {
    this.id = usuario.id;
    this.nombre = usuario.nombre;
    this.apellido = usuario.apellido;
    this.email = usuario.email;
    
    this.rol = {
      id: usuario.rol?.id ?? 0,
      nombre: usuario.rol?.nombre ?? '',
    };

    this.modulos = usuario.rol?.modulos?.map((rm) => ({
      codigo: rm.modulo.codigo,
      puedeEditar: rm.puede_editar,
    })) ?? [];
  }
}