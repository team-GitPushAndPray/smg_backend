import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de Acceso y Configuración...');

  // 1. Crear Módulos (usando upsert por su código único)
  const modMaquinas = await prisma.modulo.upsert({
    where: { codigo: 'maquinas' },
    update: { nombre: 'Máquinas' },
    create: { codigo: 'maquinas', nombre: 'Máquinas' },
  });

  const modVendedores = await prisma.modulo.upsert({
    where: { codigo: 'vendedores' },
    update: { nombre: 'Vendedores' },
    create: { codigo: 'vendedores', nombre: 'Vendedores' },
  });

  const modConfiguracion = await prisma.modulo.upsert({
    where: { codigo: 'configuracion' },
    update: { nombre: 'Configuración' },
    create: { codigo: 'configuracion', nombre: 'Configuración' },
  });

  console.log('✅ Módulos creados:', [
    modMaquinas.codigo,
    modVendedores.codigo,
    modConfiguracion.codigo,
  ]);

  // 2. Crear Rol: Administrador (es_sistema: true)
  const rolAdmin = await prisma.rol.upsert({
    where: { nombre: 'Administrador' },
    update: {
      descripcion: 'Acceso total al sistema, incluida la configuración',
      activo: true,
      es_sistema: true,
    },
    create: {
      nombre: 'Administrador',
      descripcion: 'Acceso total al sistema, incluida la configuración',
      activo: true,
      es_sistema: true,
    },
  });

  // 3. Crear Rol: Taller (es_sistema: false)
  const rolTaller = await prisma.rol.upsert({
    where: { nombre: 'Taller' },
    update: {
      descripcion: 'Acceso operativo al módulo de máquinas',
      activo: true,
      es_sistema: false,
    },
    create: {
      nombre: 'Taller',
      descripcion: 'Acceso operativo al módulo de máquinas',
      activo: true,
      es_sistema: false,
    },
  });

  console.log('✅ Roles creados:', [rolAdmin.nombre, rolTaller.nombre]);

  // 4. Vincular Roles con Módulos en rol_modulo
  // Administrador -> Todos los módulos
  const todosLosModulos = [modMaquinas, modVendedores, modConfiguracion];
  for (const mod of todosLosModulos) {
    await prisma.rolModulo.upsert({
      where: {
        rol_id_modulo_id: {
          rol_id: rolAdmin.id,
          modulo_id: mod.id,
        },
      },
      update: {},
      create: {
        rol_id: rolAdmin.id,
        modulo_id: mod.id,
      },
    });
  }

  // Taller -> Solo módulo 'maquinas' (limpiamos otros por si existían y asignamos maquinas)
  await prisma.rolModulo.deleteMany({
    where: { rol_id: rolTaller.id },
  });
  await prisma.rolModulo.create({
    data: {
      rol_id: rolTaller.id,
      modulo_id: modMaquinas.id,
    },
  });

  console.log('✅ Permisos rol_modulo asignados correctamente.');

  // 5. Crear Usuarios de prueba con contraseñas hasheadas con bcrypt
  const saltRounds = 10;
  const adminPasswordHash = await bcrypt.hash('Admin123!', saltRounds);
  const tallerPasswordHash = await bcrypt.hash('Taller123!', saltRounds);

  const userAdmin = await prisma.usuario.upsert({
    where: { email: 'admin@smg.com' },
    update: {
      nombre: 'Admin',
      apellido: 'Sistema',
      password: adminPasswordHash,
      rol_id: rolAdmin.id,
      activo: true,
    },
    create: {
      nombre: 'Admin',
      apellido: 'Sistema',
      email: 'admin@smg.com',
      password: adminPasswordHash,
      telefono: '+5492990000001',
      rol_id: rolAdmin.id,
      activo: true,
    },
  });

  const userTaller = await prisma.usuario.upsert({
    where: { email: 'taller@smg.com' },
    update: {
      nombre: 'Operador',
      apellido: 'Taller',
      password: tallerPasswordHash,
      rol_id: rolTaller.id,
      activo: true,
    },
    create: {
      nombre: 'Operador',
      apellido: 'Taller',
      email: 'taller@smg.com',
      password: tallerPasswordHash,
      telefono: '+5492990000002',
      rol_id: rolTaller.id,
      activo: true,
    },
  });

  console.log('✅ Usuarios creados:', [userAdmin.email, userTaller.email]);

  const catMinicargadora = await prisma.categoria.upsert({
    where: { nombre: 'minicargadora' },
    update: {},
    create: { 
      nombre: 'minicargadora', 
      descripcion: 'descripcion de la minicargadora' 
    },
  });

  const catBalde = await prisma.categoria.upsert({
    where: { nombre: 'balde' },
    update: {},
    create: { 
      nombre: 'balde', 
      descripcion: 'descripcion del balde' 
    },
  });

  await prisma.equipo.upsert({
    where: { codigo_interno: '30' },
    update: {},
    create: {
      codigo_interno: '30',
      marca: 'bobcat',
      estado: 'disponible',
      ubicacion: 'base',
      descripcion: 'asd',
      activo: true,
      id_categoria: catMinicargadora.id,
      maquina: {
        create: {
          modelo: 'S530',
          anio: 2017,
          n_serie: 'B42811183',
          horas_motor_actual: 4230,
        },
      },
    },
  });

  await prisma.equipo.upsert({
    where: { codigo_interno: 'B30' },
    update: {},
    create: {
      codigo_interno: 'B30',
      marca: null, 
      estado: 'disponible',
      ubicacion: 'base',
      descripcion: 'asd',
      activo: true,
      id_categoria: catBalde.id,
      aditamento: {
        create: {
        },
      },
    },
  });

  console.log('¡Datos inyectados correctamente! ✅');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });