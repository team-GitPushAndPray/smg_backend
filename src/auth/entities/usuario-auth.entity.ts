import { Usuario, Rol, Modulo } from '@prisma/client';

// Tipo que permite que password sea opcional (ya que lo omitimos con Prisma)
type UsuarioConRelaciones = Omit<Usuario, 'password'> & {
  password?: string;
  rol: (Rol & {
    modulos: ( { modulo: Modulo } )[];
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
  modulos: string[];

  constructor(usuario: UsuarioConRelaciones) {
    this.id = usuario.id;
    this.nombre = usuario.nombre;
    this.apellido = usuario.apellido;
    this.email = usuario.email;
    
    this.rol = {
      id: usuario.rol?.id ?? 0,
      nombre: usuario.rol?.nombre ?? '',
    };

    this.modulos = usuario.rol?.modulos?.map((rm) => rm.modulo.codigo) ?? [];
  }
}