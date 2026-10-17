export class UsuarioEntity {
    
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string | null;
    activo: boolean;
    ultimoAcceso: Date | null;
    rol: {
        id: number;
        nombre: string;
    };

    constructor(partial: any) {
    this.id = partial.id;
    this.nombre = partial.nombre;
    this.apellido = partial.apellido;
    this.email = partial.email;
    this.telefono = partial.telefono ?? null;
    this.activo = partial.activo;
    this.ultimoAcceso = partial.ultimo_acceso ?? null;
    this.rol = {
      id: partial.rol.id,
      nombre: partial.rol.nombre,
    };
  }

  static fromPrisma(usuario: any): UsuarioEntity {
    return new UsuarioEntity(usuario);
  }
}
