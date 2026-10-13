-- CreateEnum
CREATE TYPE "CargoVendedor" AS ENUM ('LOGISTICA', 'VENTAS', 'ALQUILERES', 'REPUESTOS');

-- CreateTable
CREATE TABLE "vendedores" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "cargo" "CargoVendedor" NOT NULL,
    "descripcion" VARCHAR(255),
    "foto" TEXT,
    "contacto" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vendedores_pkey" PRIMARY KEY ("id")
);
