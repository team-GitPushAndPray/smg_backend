-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "rol_id" INTEGER NOT NULL,
    "nombre" TEXT NOT NULL,
    "apellido" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "telefono" TEXT,
    "telegram_chat_id" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMP(3),
    "creado_en" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categorias" (
    "id" SERIAL NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "categorias_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "equipos" (
    "id" SERIAL NOT NULL,
    "codigo_interno" TEXT NOT NULL,
    "marca" TEXT,
    "estado" TEXT NOT NULL,
    "ubicacion" TEXT,
    "descripcion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "id_categoria" INTEGER NOT NULL,

    CONSTRAINT "equipos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "maquinas" (
    "equipo_id" INTEGER NOT NULL,
    "modelo" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "n_serie" TEXT NOT NULL,
    "horas_motor_acutal" INTEGER NOT NULL,

    CONSTRAINT "maquinas_pkey" PRIMARY KEY ("equipo_id")
);

-- CreateTable
CREATE TABLE "aditamentos" (
    "equipo_id" INTEGER NOT NULL,
    "maquina_id" INTEGER,

    CONSTRAINT "aditamentos_pkey" PRIMARY KEY ("equipo_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "categorias_nombre_key" ON "categorias"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "equipos_codigo_interno_key" ON "equipos"("codigo_interno");

-- AddForeignKey
ALTER TABLE "equipos" ADD CONSTRAINT "equipos_id_categoria_fkey" FOREIGN KEY ("id_categoria") REFERENCES "categorias"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "maquinas" ADD CONSTRAINT "maquinas_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aditamentos" ADD CONSTRAINT "aditamentos_equipo_id_fkey" FOREIGN KEY ("equipo_id") REFERENCES "equipos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "aditamentos" ADD CONSTRAINT "aditamentos_maquina_id_fkey" FOREIGN KEY ("maquina_id") REFERENCES "maquinas"("equipo_id") ON DELETE SET NULL ON UPDATE CASCADE;
