import { PrismaClient, TipoPlantilla, AplicaA } from '@prisma/client';
import { PLANTILLAS_CHECKLIST_SEED } from './plantillas-checklist.data.js';

export async function seedPlantillasChecklist(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Iniciando seed de plantillas de checklist...');

  await prisma.$transaction(async (tx) => {
    
    const plantillaAlquilerPrevia = await tx.plantillaChecklist.findFirst({
      where: {
        tipo: TipoPlantilla.ALQUILERES,
        OR: [
          { aplica_a: null },
          { nombre: 'Entrega / Devolución' },
        ],
      },
    });

    if (plantillaAlquilerPrevia) {
      await tx.plantillaChecklist.update({
        where: { id: plantillaAlquilerPrevia.id },
        data: {
          nombre: 'Alquiler — Máquina',
          aplica_a: AplicaA.MAQUINA,
          activo: true,
        },
      });
      console.log(
        `🔄 Plantilla ALQUILERES previa (ID: ${plantillaAlquilerPrevia.id}) preservada y migrada a "Alquiler — Máquina".`
      );
    }

    for (const plantillaConfig of PLANTILLAS_CHECKLIST_SEED) {
      let plantilla = await tx.plantillaChecklist.findFirst({
        where: {
          tipo: plantillaConfig.tipo,
          aplica_a: plantillaConfig.aplica_a,
        },
      });

      if (!plantilla) {
        plantilla = await tx.plantillaChecklist.create({
          data: {
            tipo: plantillaConfig.tipo,
            nombre: plantillaConfig.nombre,
            aplica_a: plantillaConfig.aplica_a,
            activo: true,
          },
        });
      } else {
        plantilla = await tx.plantillaChecklist.update({
          where: { id: plantilla.id },
          data: {
            nombre: plantillaConfig.nombre,
            activo: true,
          },
        });
      }

      // Sincronizar ítems
      for (let i = 0; i < plantillaConfig.items.length; i++) {
        const orden = i + 1;
        const itemRaw = plantillaConfig.items[i];
        const nombre = typeof itemRaw === 'string' ? itemRaw : itemRaw.nombre;
        const activo = typeof itemRaw === 'string' ? true : (itemRaw.activo ?? true);

        await tx.plantillaItem.upsert({
          where: {
            plantilla_id_orden: {
              plantilla_id: plantilla.id,
              orden,
            },
          },
          update: {
            nombre,
            activo,
          },
          create: {
            plantilla_id: plantilla.id,
            nombre,
            orden,
            activo,
          },
        });
      }

      await tx.plantillaItem.updateMany({
        where: {
          plantilla_id: plantilla.id,
          nombre: { equals: 'empresa', mode: 'insensitive' },
        },
        data: { activo: false },
      });

      console.log(
        `✅ Plantilla [${plantilla.tipo}] "${plantilla.nombre}" (aplica_a: ${plantilla.aplica_a ?? 'null'}) sincronizada con ${plantillaConfig.items.length} ítems.`
      );
    }
  });

  console.log('✨ Seed de plantillas de checklist completado con éxito.');
}