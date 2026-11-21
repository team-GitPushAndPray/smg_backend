-- CreateEnum
CREATE TYPE "CanalNotificacion" AS ENUM ('TELEGRAM', 'EMAIL');

-- CreateEnum
CREATE TYPE "EtapaNotificacion" AS ENUM ('PROXIMO', 'VENCIDO');

-- CreateEnum
CREATE TYPE "EstadoEnvio" AS ENUM ('ENVIADO', 'ERROR');

-- AlterTable
ALTER TABLE "aviso" ADD COLUMN     "notificado_vencido_en" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "regla_notificacion" (
    "id" SERIAL NOT NULL,
    "tipo_aviso" "TipoAviso" NOT NULL,
    "canal" "CanalNotificacion" NOT NULL,
    "destino" TEXT NOT NULL,
    "etiqueta" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regla_notificacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notificacion_enviada" (
    "id" SERIAL NOT NULL,
    "aviso_id" INTEGER NOT NULL,
    "regla_id" INTEGER,
    "etapa" "EtapaNotificacion" NOT NULL,
    "canal" "CanalNotificacion" NOT NULL,
    "destino" TEXT NOT NULL,
    "mensaje" TEXT NOT NULL,
    "estado" "EstadoEnvio" NOT NULL,
    "error_detalle" TEXT,
    "enviado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notificacion_enviada_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "notificacion_enviada" ADD CONSTRAINT "notificacion_enviada_aviso_id_fkey" FOREIGN KEY ("aviso_id") REFERENCES "aviso"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notificacion_enviada" ADD CONSTRAINT "notificacion_enviada_regla_id_fkey" FOREIGN KEY ("regla_id") REFERENCES "regla_notificacion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "aviso" SET "notificado_en" = CURRENT_TIMESTAMP WHERE "notificado_en" IS NULL;