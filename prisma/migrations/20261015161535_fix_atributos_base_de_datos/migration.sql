/*
  Warnings:

  - You are about to drop the column `maquina_id` on the `aditamentos` table. All the data in the column will be lost.
  - You are about to drop the column `horas_motor_acutal` on the `maquinas` table. All the data in the column will be lost.
  - The primary key for the `vendedores` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The `id` column on the `vendedores` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `horas_motor_actual` to the `maquinas` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "aditamentos" DROP CONSTRAINT "aditamentos_maquina_id_fkey";

-- AlterTable
ALTER TABLE "aditamentos" DROP COLUMN "maquina_id";

-- AlterTable
ALTER TABLE "maquinas" RENAME COLUMN "horas_motor_acutal" TO "horas_motor_actual";

-- AlterTable
ALTER TABLE "vendedores" DROP CONSTRAINT "vendedores_pkey",
DROP COLUMN "id",
ADD COLUMN     "id" SERIAL NOT NULL,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP,
ADD CONSTRAINT "vendedores_pkey" PRIMARY KEY ("id");
