-- CreateEnum
CREATE TYPE "EstadoPostulacion" AS ENUM ('NUEVO', 'EN_REVISION', 'CONTACTADO', 'DESCARTADO');

-- CreateTable
CREATE TABLE "vacantes" (
    "id" SERIAL NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "requisitos" TEXT NOT NULL,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vacantes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "postulaciones" (
    "id" SERIAL NOT NULL,
    "vacante_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "mensaje" TEXT,
    "cv_url" TEXT NOT NULL,
    "cv_nombre_original" TEXT NOT NULL,
    "estado" "EstadoPostulacion" NOT NULL DEFAULT 'NUEVO',
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "postulaciones_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "postulaciones" ADD CONSTRAINT "postulaciones_vacante_id_fkey" FOREIGN KEY ("vacante_id") REFERENCES "vacantes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
