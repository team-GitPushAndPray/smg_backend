/*
  Warnings:

  - A unique constraint covering the columns `[nombre]` on the table `plantilla_checklist` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tipo,aplica_a]` on the table `plantilla_checklist` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "AplicaA" AS ENUM ('MAQUINA', 'ADITAMENTO');

-- DropIndex
DROP INDEX "plantilla_checklist_tipo_key";

-- AlterTable
ALTER TABLE "plantilla_checklist" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "aplica_a" "AplicaA";

-- CreateIndex
CREATE UNIQUE INDEX "plantilla_checklist_nombre_key" ON "plantilla_checklist"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "plantilla_checklist_tipo_aplica_a_key" ON "plantilla_checklist"("tipo", "aplica_a");
