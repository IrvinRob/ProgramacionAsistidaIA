-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'SOCIO', 'ASISTENTE');

-- CreateTable
CREATE TABLE "Usuario" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT,
    "nombre" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "rol" "RolUsuario" NOT NULL DEFAULT 'ASISTENTE',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_clerkUserId_key" ON "Usuario"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE INDEX "Usuario_activo_rol_idx" ON "Usuario"("activo", "rol");

-- CreateIndex
CREATE INDEX "Usuario_nombre_idx" ON "Usuario"("nombre");
