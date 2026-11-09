import { EstadoEquipo, PrismaClient } from '@prisma/client';
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
        in: ['maquinas', 'configuracion', 'vendedores', 'alquileres', 'avisos'],
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

  const modAlquileres = await prisma.modulo.upsert({
    where: { codigo: 'ALQUILERES' },
    update: { nombre: 'Alquileres' },
    create: { codigo: 'ALQUILERES', nombre: 'Alquileres' },
  });

  const modAvisos = await prisma.modulo.upsert({
    where: { codigo: 'AVISOS' },
    update: { nombre: 'Avisos' },
    create: { codigo: 'AVISOS', nombre: 'Avisos' },
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

  // 6. Permisos para ALQUILERES (Issue Madre #75)
  // superAdmin: pasa siempre por es_sistema: true
  // administrador, logistica, taller: acceso sí, puede_editar: true
  // servicio_tecnico: acceso sí, puede_editar: false
  // personal: sin acceso (no se asocia fila en rolModulo)
  const permisosAlquileres = [
    { rolNombre: 'administrador', puede_editar: true },
    { rolNombre: 'logistica', puede_editar: true },
    { rolNombre: 'taller', puede_editar: true },
    { rolNombre: 'servicio_tecnico', puede_editar: false },
  ];

  for (const permiso of permisosAlquileres) {
    await prisma.rolModulo.create({
      data: {
        rol_id: rolesMap[permiso.rolNombre].id,
        modulo_id: modAlquileres.id,
        puede_editar: permiso.puede_editar,
      },
    });
  }

  // 6.b Permisos para AVISOS (M-12 / Sub-issue #99)
  // Lo ven los mismos roles que ven MAQUINAS;
  // puede_editar: true para taller, servicio_tecnico, logistica y superiores (administrador).
  // superAdmin pasa siempre por es_sistema: true.
  const permisosAvisos = [
    { rolNombre: 'administrador', puede_editar: true },
    { rolNombre: 'logistica', puede_editar: true },
    { rolNombre: 'servicio_tecnico', puede_editar: true },
    { rolNombre: 'taller', puede_editar: true },
    { rolNombre: 'personal', puede_editar: false },
  ];

  for (const permiso of permisosAvisos) {
    await prisma.rolModulo.create({
      data: {
        rol_id: rolesMap[permiso.rolNombre].id,
        modulo_id: modAvisos.id,
        puede_editar: permiso.puede_editar,
      },
    });
  }

  // 7. Asignar CONFIGURACION y VENDEDORES a 'administrador'
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

  // 8. Usuarios del sistema
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

  await prisma.usuario.upsert({
    where: { email: 'tecnico@smg.com' },
    update: {
      rol_id: rolesMap['servicio_tecnico'].id,
      activo: true,
      password: defaultTestPass,
    },
    create: {
      nombre: 'Usuario',
      apellido: 'Servicio Técnico',
      email: 'tecnico@smg.com',
      password: defaultTestPass,
      rol_id: rolesMap['servicio_tecnico'].id,
      activo: true,
    },
  });

  await prisma.usuario.upsert({
    where: { email: 'personal@smg.com' },
    update: {
      rol_id: rolesMap['personal'].id,
      activo: true,
      password: defaultTestPass,
    },
    create: {
      nombre: 'Usuario',
      apellido: 'Personal',
      email: 'personal@smg.com',
      password: defaultTestPass,
      rol_id: rolesMap['personal'].id,
      activo: true,
    },
  });

  // =====================================================================
  // 9. Seed de Equipos para pruebas
  // =====================================================================
  console.log('🌱 Poblando categorías y equipos de prueba...');

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

  await prisma.equipo.upsert({
    where: { codigo_interno: 'EXC-001' },
    update: { activo: true, estado: EstadoEquipo.disponible },
    create: {
      codigo_interno: 'EXC-001',
      marca: 'Caterpillar',
      ubicacion: 'Base Neuquén',
      descripcion: 'Excavadora lista para uso',
      estado: EstadoEquipo.disponible,
      activo: true,
      id_categoria: catExcavadoras.id,
      maquina: {
        create: {
          modelo: '320D',
          anio: 2018,
          n_serie: 'CAT320D123456',
          horas_motor_actual: 1500,
          horas_actualizadas_en: new Date(),
        },
      },
    },
  });

  await prisma.equipo.upsert({
    where: { codigo_interno: 'EXC-002' },
    update: { activo: true, estado: EstadoEquipo.en_taller },
    create: {
      codigo_interno: 'EXC-002',
      marca: 'Komatsu',
      ubicacion: 'Taller Central',
      descripcion: 'Para probar bloqueos por baja',
      estado: EstadoEquipo.en_taller,
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

  await prisma.equipo.upsert({
    where: { codigo_interno: 'MRT-001' },
    update: { activo: true, estado: EstadoEquipo.disponible },
    create: {
      codigo_interno: 'MRT-001',
      marca: 'Atlas Copco',
      ubicacion: 'Depósito A',
      descripcion: 'Martillo para retroexcavadora',
      estado: EstadoEquipo.disponible,
      activo: true,
      id_categoria: catMartillos.id,
      aditamento: {
        create: {},
      },
    },
  });

  // =====================================================================
  // 10. Seed de Clientes ficticios (Issue Madre #75 / Sub-issue #77)
  // =====================================================================
  console.log('🌱 Poblando clientes de prueba...');

  const clientesSeed = [
    {
      razon_social: 'Constructora Del Valle S.A.',
      cuit: '30-71001001-9',
      contacto_nombre: 'Martín Gómez',
      telefono: '+54 9 299 411-2233',
      email: 'compras@constructoradelvalle.com.ar',
      direccion: 'Av. Argentina 1250',
      localidad: 'Neuquén Capital',
      observaciones: 'Cliente frecuente para obras viales.',
      activo: true,
    },
    {
      razon_social: 'Servicios Petroleros Patagónicos S.R.L.',
      cuit: '30-71002002-7',
      contacto_nombre: 'Laura Fernández',
      telefono: '+54 9 299 522-3344',
      email: 'logistica@sppatagonicos.com.ar',
      direccion: 'Ruta Provincial 7 Km 5',
      localidad: 'Añelo',
      observaciones: 'Opera en yacimientos de la cuenca neuquina.',
      activo: true,
    },
    {
      razon_social: 'Ingeniería y Montajes Austral S.A.',
      cuit: '30-71003003-5',
      contacto_nombre: 'Roberto Díaz',
      telefono: '+54 9 299 633-4455',
      email: 'rdiaz@imaustral.com.ar',
      direccion: 'Parque Industrial Lote 14',
      localidad: 'Centenario',
      observaciones: null,
      activo: true,
    },
    {
      razon_social: 'Movimientos de Suelo Limay S.A.S.',
      cuit: '30-71004004-3',
      contacto_nombre: 'Carolina Silva',
      telefono: '+54 9 299 444-5566',
      email: 'administracion@sueloslimay.com.ar',
      direccion: 'Juan B. Justo 480',
      localidad: 'Plottier',
      observaciones: 'Alquila minicargadoras con aditamentos.',
      activo: true,
    },
    {
      razon_social: 'Obras Civiles del Sur S.R.L.',
      cuit: '30-71005005-1',
      contacto_nombre: 'Jorge Morales',
      telefono: '+54 9 299 555-6677',
      email: 'contacto@obrasdelsur.com.ar',
      direccion: 'San Martín 890',
      localidad: 'Cipolletti',
      observaciones: 'Cuenta inactiva por cierre de operaciones.',
      activo: false,
    },
  ];

  for (const c of clientesSeed) {
    await prisma.cliente.upsert({
      where: { cuit: c.cuit },
      update: c,
      create: c,
    });
  }

  // =====================================================================
  // 11. Seed de Escalones de Servicio (M-12 / Sub-issue #99)
  // =====================================================================
  console.log('🌱 Poblando escalones de servicio...');

  const escalonesSeed = [
    { horas_intervalo: 250, nombre: 'Service 250 hs' },
    { horas_intervalo: 500, nombre: 'Service 500 hs' },
    { horas_intervalo: 1000, nombre: 'Service 1000 hs' },
  ];

  for (const escalon of escalonesSeed) {
    await prisma.escalonServicio.upsert({
      where: { horas_intervalo: escalon.horas_intervalo },
      update: { nombre: escalon.nombre },
      create: {
        horas_intervalo: escalon.horas_intervalo,
        nombre: escalon.nombre,
        descripcion: null,
      },
    });
  }

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