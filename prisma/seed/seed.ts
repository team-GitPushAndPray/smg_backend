import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Iniciando carga de datos de prueba... 🌱');

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