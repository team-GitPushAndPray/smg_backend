-- CreateEnum
CREATE TYPE "TipoAviso" AS ENUM ('SERVICIO', 'CERTIFICACION');

-- CreateEnum
CREATE TYPE "EstadoAviso" AS ENUM ('PENDIENTE', 'ATENDIDO');

-- AlterTable
ALTER TABLE "maquinas" ADD COLUMN     "certificacion_vence_el" DATE;

-- CreateTable
CREATE TABLE "escalon_servicio" (
    "id" SERIAL NOT NULL,
    "horas_intervalo" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "escalon_servicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "aviso" (
    "id" SERIAL NOT NULL,
    "maquina_id" INTEGER NOT NULL,
    "tipo" "TipoAviso" NOT NULL,
    "hito_horas" INTEGER,
    "escalon_id" INTEGER,
    "vence_el" DATE,
    "estado" "EstadoAviso" NOT NULL DEFAULT 'PENDIENTE',
    "nota_atencion" TEXT,
    "atendido_por_id" INTEGER,
    "atendido_en" TIMESTAMP(3),
    "notificado_en" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aviso_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "escalon_servicio_horas_intervalo_key" ON "escalon_servicio"("horas_intervalo");

-- CreateIndex
CREATE UNIQUE INDEX "aviso_maquina_id_tipo_hito_horas_key" ON "aviso"("maquina_id", "tipo", "hito_horas");

-- CreateIndex
CREATE UNIQUE INDEX "aviso_maquina_id_tipo_vence_el_key" ON "aviso"("maquina_id", "tipo", "vence_el");

-- AddForeignKey
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_maquina_id_fkey" FOREIGN KEY ("maquina_id") REFERENCES "maquinas"("equipo_id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_escalon_id_fkey" FOREIGN KEY ("escalon_id") REFERENCES "escalon_servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aviso" ADD CONSTRAINT "aviso_atendido_por_id_fkey" FOREIGN KEY ("atendido_por_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
