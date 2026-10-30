import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { seedPlantillasChecklist } from './plantillas-checklist.seed.js';

const prisma = new PrismaClient();

async function main() {
  const superAdminEmail = process.env.SUPERADMIN_EMAIL;
  const superAdminPassword = process.env.SUPERADMIN_PASSWORD;

  if (!superAdminEmail || !superAdminPassword) {
    throw new Error(
      'Faltan las variables de entorno SUPERADMIN_EMAIL o SUPERADMIN_PASSWORD en el archivo .env',
    );
  }

  console.log('🌱 Iniciando seed de seguridad y permisos...');

  // 1. Limpieza de relaciones primero para no trabar borrados por foreign keys
  await prisma.rolModulo.deleteMany({});

  // 2. Eliminar posibles duplicados viejos en minúscula
  await prisma.modulo.deleteMany({
    where: {
      codigo: {
        in: ['maquinas', 'configuracion', 'vendedores'],
      },
    },
  });

  // 3. Upsert canónico con códigos en MAYÚSCULAS
  const modMaquinas = await prisma.modulo.upsert({
    where: { codigo: 'MAQUINAS' },
    update: { nombre: 'Máquinas' },
    create: { codigo: 'MAQUINAS', nombre: 'Máquinas' },
  });

  const modConfiguracion = await prisma.modulo.upsert({
    where: { codigo: 'CONFIGURACION' },
    update: { nombre: 'Configuración' },
    create: { codigo: 'CONFIGURACION', nombre: 'Configuración' },
  });

  const modVendedores = await prisma.modulo.upsert({
    where: { codigo: 'VENDEDORES' },
    update: { nombre: 'Vendedores' },
    create: { codigo: 'VENDEDORES', nombre: 'Vendedores' },
  });

  // 4. Roles
  const rolesData = [
    {
      nombre: 'superAdmin',
      descripcion: 'Acceso total al sistema sin restricciones',
      es_sistema: true,
    },
    {
      nombre: 'administrador',
      descripcion: 'Administración general del sistema',
      es_sistema: false,
    },
    {
      nombre: 'logistica',
      descripcion: 'Gestión logística y movimiento de máquinas',
      es_sistema: false,
    },
    {
      nombre: 'servicio_tecnico',
      descripcion: 'Soporte y servicio técnico en campo',
      es_sistema: false,
    },
    {
      nombre: 'taller',
      descripcion: 'Operaciones y mantenimiento en taller',
      es_sistema: false,
    },
    {
      nombre: 'personal',
      descripcion: 'Consulta general para personal interno',
      es_sistema: false,
    },
  ];

  const rolesMap: Record<string, any> = {};

  for (const r of rolesData) {
    const rol = await prisma.rol.upsert({
      where: { nombre: r.nombre },
      update: {
        descripcion: r.descripcion,
        es_sistema: r.es_sistema,
        activo: true,
      },
      create: {
        nombre: r.nombre,
        descripcion: r.descripcion,
        es_sistema: r.es_sistema,
        activo: true,
      },
    });
    rolesMap[r.nombre] = rol;
  }

  // 5. Permisos para MAQUINAS
  const permisosMaquinas = [
    { rolNombre: 'administrador', puede_editar: true },
    { rolNombre: 'logistica', puede_editar: true },
    { rolNombre: 'servicio_tecnico', puede_editar: false },
    { rolNombre: 'taller', puede_editar: false },
    { rolNombre: 'personal', puede_editar: false },
  ];

  for (const permiso of permisosMaquinas) {
    await prisma.rolModulo.create({
      data: {
        rol_id: rolesMap[permiso.rolNombre].id,
        modulo_id: modMaquinas.id,
        puede_editar: permiso.puede_editar,
      },
    });
  }

  // 6. Asignar CONFIGURACION y VENDEDORES a 'administrador' con puede_editar = true
  await prisma.rolModulo.create({
    data: {
      rol_id: rolesMap['administrador'].id,
      modulo_id: modConfiguracion.id,
      puede_editar: true,
    },
  });

  await prisma.rolModulo.create({
    data: {
      rol_id: rolesMap['administrador'].id,
      modulo_id: modVendedores.id,
      puede_editar: true,
    },
  });

  // 7. Usuarios del sistema
  const hashedSuperAdminPassword = await bcrypt.hash(superAdminPassword, 10);

  await prisma.usuario.upsert({
    where: { email: superAdminEmail.toLowerCase().trim() },
    update: {
      password: hashedSuperAdminPassword,
      rol_id: rolesMap['superAdmin'].id,
      activo: true,
    },
    create: {
      nombre: 'Super',
      apellido: 'Admin',
      email: superAdminEmail.toLowerCase().trim(),
      password: hashedSuperAdminPassword,
      rol_id: rolesMap['superAdmin'].id,
      activo: true,
    },
  });

  const defaultTestPass = await bcrypt.hash('Test1234!', 10);

  await prisma.usuario.upsert({
    where: { email: 'admin@smg.com' },
    update: {
      rol_id: rolesMap['administrador'].id,
      activo: true,
      password: defaultTestPass,
    },
    create: {
      nombre: 'Usuario',
      apellido: 'Administrador',
      email: 'admin@smg.com',
      password: defaultTestPass,
      rol_id: rolesMap['administrador'].id,
      activo: true,
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'logistica@smg.com' },
    update: {
      rol_id: rolesMap['logistica'].id,
      activo: true,
      password: defaultTestPass,
    },
    create: {
      nombre: 'Usuario',
      apellido: 'Logística',
      email: 'logistica@smg.com',
      password: defaultTestPass,
      rol_id: rolesMap['logistica'].id,
      activo: true,
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'taller@smg.com' },
    update: {
      rol_id: rolesMap['taller'].id,
      activo: true,
      password: defaultTestPass,
    },
    create: {
      nombre: 'Usuario',
      apellido: 'Taller',
      email: 'taller@smg.com',
      password: defaultTestPass,
      rol_id: rolesMap['taller'].id,
      activo: true,
    },
  });

  // =====================================================================
  // 8. Seed de Equipos para pruebas
  // =====================================================================
  console.log('🌱 Poblando categorías y equipos de prueba...');

  // 8.1 Crear Categorías
  const catExcavadoras = await prisma.categoria.upsert({
    where: { nombre: 'Excavadoras' },
    update: {},
    create: { nombre: 'Excavadoras', descripcion: 'Máquinas para excavación pesada' },
  });

  const catPalas = await prisma.categoria.upsert({
    where: { nombre: 'Palas Cargadoras' },
    update: {},
    create: { nombre: 'Palas Cargadoras', descripcion: 'Equipos frontales' },
  });

  const catMartillos = await prisma.categoria.upsert({
    where: { nombre: 'Martillos Hidráulicos' },
    update: {},
    create: { nombre: 'Martillos Hidráulicos', descripcion: 'Aditamentos de demolición' },
  });

  // 8.2 Crear Equipos de tipo MÁQUINA
  // Máquina 1 (Para probar flujo feliz)
  await prisma.equipo.upsert({
    where: { codigo_interno: 'EXC-001' },
    update: { activo: true, estado: 'disponible' },
    create: {
      codigo_interno: 'EXC-001',
      marca: 'Caterpillar',
      ubicacion: 'Base Neuquén',
      descripcion: 'Excavadora lista para uso',
      estado: 'disponible',
      activo: true,
      id_categoria: catExcavadoras.id,
      maquina: {
        create: {
          modelo: '320D',
          anio: 2018,
          n_serie: 'CAT320D123456',
          horas_motor_actual: 1500, // <--- Úsala para probar PATCH /horas
          horas_actualizadas_en: new Date(),
        },
      },
    },
  });

  // Máquina 2 (Para probar que al dar de baja ya no se puede operar)
  await prisma.equipo.upsert({
    where: { codigo_interno: 'EXC-002' },
    update: { activo: true, estado: 'en_taller' },
    create: {
      codigo_interno: 'EXC-002',
      marca: 'Komatsu',
      ubicacion: 'Taller Central',
      descripcion: 'Para probar bloqueos por baja',
      estado: 'en_taller',
      activo: true,
      id_categoria: catExcavadoras.id,
      maquina: {
        create: {
          modelo: 'PC200',
          anio: 2015,
          n_serie: 'KOMPC200789',
          horas_motor_actual: 5000,
          horas_actualizadas_en: new Date(),
        },
      },
    },
  });

  // 8.3 Crear Equipo de tipo ADITAMENTO (Para probar el error 400 de horas)
  await prisma.equipo.upsert({
    where: { codigo_interno: 'MRT-001' },
    update: { activo: true, estado: 'disponible' },
    create: {
      codigo_interno: 'MRT-001',
      marca: 'Atlas Copco',
      ubicacion: 'Depósito A',
      descripcion: 'Martillo para retroexcavadora',
      estado: 'disponible',
      activo: true,
      id_categoria: catMartillos.id,
      aditamento: {
        create: {},
      },
    },
  });

  await seedPlantillasChecklist(prisma);

  console.log('✅ Seed ejecutado correctamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });