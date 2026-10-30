-- CreateEnum
CREATE TYPE "TipoPlantilla" AS ENUM ('DIARIO', 'MANTENIMIENTO', 'ALQUILERES');

-- CreateEnum
CREATE TYPE "TipoChecklist" AS ENUM ('DIARIO', 'MANTENIMIENTO', 'ENTREGA', 'DEVOLUCION');

-- CreateEnum
CREATE TYPE "EstadoItem" AS ENUM ('NORMAL', 'ANORMAL', 'NO_APLICA');

-- CreateTable
CREATE TABLE "plantilla_checklist" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoPlantilla" NOT NULL,
    "nombre" TEXT NOT NULL,

    CONSTRAINT "plantilla_checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plantilla_item" (
    "id" SERIAL NOT NULL,
    "plantilla_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,

    CONSTRAINT "plantilla_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist" (
    "id" SERIAL NOT NULL,
    "tipo" "TipoChecklist" NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "equipo_id" INTEGER NOT NULL,
    "usuario_id" INTEGER,
    "horas_motor" INTEGER,
    "observaciones" TEXT,

    CONSTRAINT "checklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_respuesta" (
    "id" SERIAL NOT NULL,
    "checklist_id" INTEGER NOT NULL,
    "plantilla_item_id" INTEGER NOT NULL,
    "estado" "EstadoItem" NOT NULL,
    "observacion" TEXT,

    CONSTRAINT "checklist_respuesta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "checklist_foto" (
    "id" SERIAL NOT NULL,
    "checklist_id" INTEGER NOT NULL,
    "url" TEXT NOT NULL,

    CONSTRAINT "checklist_foto_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "plantilla_checklist_tipo_key" ON "plantilla_checklist"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "plantilla_item_plantilla_id_orden_key" ON "plantilla_item"("plantilla_id", "orden");

-- CreateIndex
CREATE UNIQUE INDEX "checklist_respuesta_checklist_id_plantilla_item_id_key" ON "checklist_respuesta"("checklist_id", "plantilla_item_id");

-- AddForeignKey
ALTER TABLE "plantilla_item" ADD CONSTRAINT "plantilla_item_plantilla_id_fkey" FOREIGN KEY ("plantilla_id") REFERENCES "plantilla_checklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist" ADD CONSTRAINT "checklist_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_respuesta" ADD CONSTRAINT "checklist_respuesta_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_respuesta" ADD CONSTRAINT "checklist_respuesta_plantilla_item_id_fkey" FOREIGN KEY ("plantilla_item_id") REFERENCES "plantilla_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "checklist_foto" ADD CONSTRAINT "checklist_foto_checklist_id_fkey" FOREIGN KEY ("checklist_id") REFERENCES "checklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
