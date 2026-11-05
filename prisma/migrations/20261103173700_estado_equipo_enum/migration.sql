-- Crear el tipo ENUM en PostgreSQL
CREATE TYPE "EstadoEquipo" AS ENUM ('disponible', 'alquilado', 'en_taller', 'fuera_de_servicio');

-- Normalizar datos existentes (minúsculas, sin espacios extremos, espacios/guiones a guion_bajo)
UPDATE "equipos"
SET "estado" = regexp_replace(lower(trim("estado")), '[\s-]+', '_', 'g')
WHERE "estado" IS NOT NULL;

-- Cualquier valor que no coincida con los 4 oficiales o sea NULL pasa a 'disponible'
UPDATE "equipos"
SET "estado" = 'disponible'
WHERE "estado" IS NULL
   OR "estado" NOT IN ('disponible', 'alquilado', 'en_taller', 'fuera_de_servicio');

-- Quitar temporalmente el DEFAULT en texto para que PostgreSQL permita el casteo de tipo
ALTER TABLE "equipos" ALTER COLUMN "estado" DROP DEFAULT;

-- Cambiar el tipo de columna de TEXT a "EstadoEquipo" conservando los datos actuales
ALTER TABLE "equipos"
ALTER COLUMN "estado" TYPE "EstadoEquipo"
USING ("estado"::"EstadoEquipo");

-- Restaurar el DEFAULT tipado y asegurar NOT NULL
ALTER TABLE "equipos" ALTER COLUMN "estado" SET DEFAULT 'disponible'::"EstadoEquipo";
ALTER TABLE "equipos" ALTER COLUMN "estado" SET NOT NULL;