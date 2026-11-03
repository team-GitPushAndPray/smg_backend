-- CreateEnum
CREATE TYPE "EstadoAlquiler" AS ENUM ('PENDIENTE', 'ACTIVO', 'FINALIZADO', 'ANULADO');

-- CreateTable
CREATE TABLE "clientes" (
    "id" SERIAL NOT NULL,
    "razon_social" TEXT NOT NULL,
    "cuit" TEXT,
    "contacto_nombre" TEXT,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "localidad" TEXT,
    "observaciones" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alquileres" (
    "id" SERIAL NOT NULL,
    "cliente_id" INTEGER NOT NULL,
    "usuario_id" INTEGER NOT NULL,
    "estado" "EstadoAlquiler" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin_prevista" DATE NOT NULL,
    "latitud" DECIMAL(9,6) NOT NULL,
    "longitud" DECIMAL(9,6) NOT NULL,
    "ubicacion_referencia" TEXT NOT NULL,
    "contacto_obra_nombre" TEXT,
    "contacto_obra_telefono" TEXT,
    "observaciones" TEXT,
    "motivo_anulacion" TEXT,
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "alquileres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alquiler_equipo" (
    "id" SERIAL NOT NULL,
    "alquiler_id" INTEGER NOT NULL,
    "equipo_id" INTEGER NOT NULL,
    "checklist_entrega_id" INTEGER,
    "checklist_devolucion_id" INTEGER,

    CONSTRAINT "alquiler_equipo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clientes_cuit_key" ON "clientes"("cuit");

-- CreateIndex
CREATE UNIQUE INDEX "alquiler_equipo_checklist_entrega_id_key" ON "alquiler_equipo"("checklist_entrega_id");

-- CreateIndex
CREATE UNIQUE INDEX "alquiler_equipo_checklist_devolucion_id_key" ON "alquiler_equipo"("checklist_devolucion_id");

-- CreateIndex
CREATE UNIQUE INDEX "alquiler_equipo_alquiler_id_equipo_id_key" ON "alquiler_equipo"("alquiler_id", "equipo_id");

-- AddForeignKey
ALTER TABLE "alquileres" ADD CONSTRAINT "alquileres_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquileres" ADD CONSTRAINT "alquileres_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquiler_equipo" ADD CONSTRAINT "alquiler_equipo_alquiler_id_fkey" FOREIGN KEY ("alquiler_id") REFERENCES "alquileres"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquiler_equipo" ADD CONSTRAINT "alquiler_equipo_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquiler_equipo" ADD CONSTRAINT "alquiler_equipo_checklist_entrega_id_fkey" FOREIGN KEY ("checklist_entrega_id") REFERENCES "checklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alquiler_equipo" ADD CONSTRAINT "alquiler_equipo_checklist_devolucion_id_fkey" FOREIGN KEY ("checklist_devolucion_id") REFERENCES "checklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
