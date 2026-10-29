
ALTER TABLE "equipos" ADD COLUMN "qr_token" UUID;

UPDATE "equipos" SET "qr_token" = gen_random_uuid() WHERE "qr_token" IS NULL;

ALTER TABLE "equipos" ALTER COLUMN "qr_token" SET NOT NULL;

CREATE UNIQUE INDEX "equipos_qr_token_key" ON "equipos"("qr_token");
