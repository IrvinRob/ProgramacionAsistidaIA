-- CreateEnum
CREATE TYPE "MotivoLectura" AS ENUM ('SESSION_START', 'POST_RESPONSE', 'MILESTONE', 'SESSION_END');

-- CreateEnum
CREATE TYPE "TipoIntervencion" AS ENUM ('SALUDO_INICIAL', 'OFERTA_AYUDA', 'ACLARACION');

-- CreateTable
CREATE TABLE "SesionEngagement" (
    "id" TEXT NOT NULL,
    "usuarioId" TEXT NOT NULL,
    "rutaInicio" TEXT NOT NULL,
    "inicioEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finEn" TIMESTAMP(3),
    "camaraActiva" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "SesionEngagement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LecturaEmocion" (
    "id" TEXT NOT NULL,
    "sesionId" TEXT NOT NULL,
    "emocionDominante" TEXT,
    "emociones" JSONB NOT NULL,
    "atencion" DOUBLE PRECISION,
    "ruta" TEXT NOT NULL,
    "motivo" "MotivoLectura" NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LecturaEmocion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IntervencionAsistente" (
    "id" TEXT NOT NULL,
    "sesionId" TEXT NOT NULL,
    "tipo" "TipoIntervencion" NOT NULL,
    "emocionDisparadora" TEXT,
    "respuestaClaude" TEXT NOT NULL,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IntervencionAsistente_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SesionEngagement_usuarioId_inicioEn_idx" ON "SesionEngagement"("usuarioId", "inicioEn");

-- CreateIndex
CREATE INDEX "LecturaEmocion_sesionId_creadoEn_idx" ON "LecturaEmocion"("sesionId", "creadoEn");

-- CreateIndex
CREATE INDEX "LecturaEmocion_ruta_creadoEn_idx" ON "LecturaEmocion"("ruta", "creadoEn");

-- CreateIndex
CREATE INDEX "IntervencionAsistente_sesionId_creadoEn_idx" ON "IntervencionAsistente"("sesionId", "creadoEn");

-- AddForeignKey
ALTER TABLE "SesionEngagement" ADD CONSTRAINT "SesionEngagement_usuarioId_fkey" FOREIGN KEY ("usuarioId") REFERENCES "Usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LecturaEmocion" ADD CONSTRAINT "LecturaEmocion_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "SesionEngagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IntervencionAsistente" ADD CONSTRAINT "IntervencionAsistente_sesionId_fkey" FOREIGN KEY ("sesionId") REFERENCES "SesionEngagement"("id") ON DELETE CASCADE ON UPDATE CASCADE;
