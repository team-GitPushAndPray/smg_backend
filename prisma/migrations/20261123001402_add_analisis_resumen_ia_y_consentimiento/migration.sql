-- CreateEnum
CREATE TYPE "EstadoAnalisis" AS ENUM ('PENDIENTE', 'COMPLETADO', 'ERROR');

-- AlterTable
ALTER TABLE "postulaciones" ADD COLUMN     "consentimiento_en" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "vacantes" ADD COLUMN     "requisitos_actualizados_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "analisis_postulacion" (
    "id" SERIAL NOT NULL,
    "postulacion_id" INTEGER NOT NULL,
    "estado" "EstadoAnalisis" NOT NULL DEFAULT 'PENDIENTE',
    "puntaje" INTEGER,
    "resumen_experiencia" TEXT,
    "justificacion" TEXT,
    "error_detalle" TEXT,
    "modelo" TEXT,
    "version_prompt" TEXT,
    "analizado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analisis_postulacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resumen_vacante_ia" (
    "id" SERIAL NOT NULL,
    "vacante_id" INTEGER NOT NULL,
    "top" JSONB NOT NULL,
    "comparacion" TEXT NOT NULL,
    "recomendacion" TEXT NOT NULL,
    "cantidad_analizadas" INTEGER NOT NULL,
    "modelo" TEXT NOT NULL,
    "generado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resumen_vacante_ia_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "analisis_postulacion_postulacion_id_key" ON "analisis_postulacion"("postulacion_id");

-- CreateIndex
CREATE UNIQUE INDEX "resumen_vacante_ia_vacante_id_key" ON "resumen_vacante_ia"("vacante_id");

-- AddForeignKey
ALTER TABLE "analisis_postulacion" ADD CONSTRAINT "analisis_postulacion_postulacion_id_fkey" FOREIGN KEY ("postulacion_id") REFERENCES "postulaciones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resumen_vacante_ia" ADD CONSTRAINT "resumen_vacante_ia_vacante_id_fkey" FOREIGN KEY ("vacante_id") REFERENCES "vacantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "analisis_postulacion" ("postulacion_id", "estado", "creado_en", "actualizado_en")
SELECT p."id", 'PENDIENTE'::"EstadoAnalisis", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "postulaciones" p
WHERE NOT EXISTS (
  SELECT 1
  FROM "analisis_postulacion" a
  WHERE a."postulacion_id" = p."id"
);