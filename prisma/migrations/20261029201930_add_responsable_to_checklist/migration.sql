/*
  Warnings:

  - Added the required column `responsable_apellido` to the `checklist` table without a default value. This is not possible if the table is not empty.
  - Added the required column `responsable_nombre` to the `checklist` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "checklist" ADD COLUMN     "responsable_apellido" VARCHAR(60) NOT NULL,
ADD COLUMN     "responsable_nombre" VARCHAR(60) NOT NULL;
