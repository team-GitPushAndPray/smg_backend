import { PrismaClient } from '@prisma/client';
import { PLANTILLAS_CHECKLIST_SEED } from './plantillas-checklist.data.js';

export async function seedPlantillasChecklist(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Iniciando seed de plantillas de checklist...');

  await prisma.$transaction(async (tx) => {
    for (const plantillaConfig of PLANTILLAS_CHECKLIST_SEED) {
        
      const plantilla = await tx.plantillaChecklist.upsert({
        where: { tipo: plantillaConfig.tipo },
        update: { nombre: plantillaConfig.nombre },
        create: {
          tipo: plantillaConfig.tipo,
          nombre: plantillaConfig.nombre,
        },
      });

      for (let i = 0; i < plantillaConfig.items.length; i++) {
        const orden = i + 1;
        const nombreItem = plantillaConfig.items[i];

        await tx.plantillaItem.upsert({
          where: {
            plantilla_id_orden: {
              plantilla_id: plantilla.id,
              orden,
            },
          },
          update: {
            nombre: nombreItem,
          },
          create: {
            plantilla_id: plantilla.id,
            nombre: nombreItem,
            orden,
          },
        });
      }

      console.log(
        `✅ Plantilla [${plantilla.tipo}] "${plantilla.nombre}" sincronizada con ${plantillaConfig.items.length} ítems.`
      );
    }
  });

  console.log('✨ Seed de plantillas de checklist completado con éxito.');
}