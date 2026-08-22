-- CreateEnum
CREATE TYPE "ComplaintType" AS ENUM ('RECLAMO', 'QUEJA');

-- CreateEnum
CREATE TYPE "ComplaintGoodType" AS ENUM ('PRODUCTO', 'SERVICIO');

-- CreateEnum
CREATE TYPE "ComplaintStatus" AS ENUM ('PENDIENTE', 'RESPONDIDO');

-- CreateTable
CREATE TABLE "complaints" (
    "id" TEXT NOT NULL,
    "number" SERIAL NOT NULL,
    "fullName" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "department" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "district" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "reference" TEXT,
    "isMinor" BOOLEAN NOT NULL DEFAULT false,
    "guardianFullName" TEXT,
    "guardianDocType" TEXT,
    "guardianDocId" TEXT,
    "guardianPhone" TEXT,
    "goodType" "ComplaintGoodType" NOT NULL,
    "orderNumber" TEXT,
    "incidentAt" TIMESTAMP(3),
    "amount" DECIMAL(10,2),
    "goodDetail" TEXT NOT NULL,
    "type" "ComplaintType" NOT NULL,
    "detail" TEXT NOT NULL,
    "request" TEXT NOT NULL,
    "status" "ComplaintStatus" NOT NULL DEFAULT 'PENDIENTE',
    "response" TEXT,
    "respondedAt" TIMESTAMP(3),
    "dueAt" TIMESTAMP(3) NOT NULL,
    "copySentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "complaints_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "complaints_number_key" ON "complaints"("number");

-- CreateIndex
CREATE INDEX "complaints_createdAt_idx" ON "complaints"("createdAt");
