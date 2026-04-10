-- CreateEnum
CREATE TYPE "Material" AS ENUM ('ORO', 'PLATA', 'ACERO', 'OTRO');

-- CreateEnum
CREATE TYPE "Categoria" AS ENUM ('ANILLO', 'COLLAR', 'PULSERA', 'ARETE', 'OTRO');

-- CreateEnum
CREATE TYPE "MetodoPago" AS ENUM ('EFECTIVO', 'TARJETA', 'TRANSFERENCIA', 'YAPE', 'PLIN');

-- CreateEnum
CREATE TYPE "Genero" AS ENUM ('HOMBRE', 'MUJER', 'UNISEX');

-- AlterEnum
ALTER TYPE "UserRole" ADD VALUE 'VENDEDOR';

-- DropForeignKey
ALTER TABLE "categories" DROP CONSTRAINT "categories_parent_id_fkey";

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "categoria" "Categoria",
ADD COLUMN     "genero" "Genero"[] DEFAULT ARRAY[]::"Genero"[],
ADD COLUMN     "material" "Material",
ADD COLUMN     "precioCosto" DOUBLE PRECISION,
ADD COLUMN     "precioVentaHombre" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "precioVentaMujer" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "precioVentaPareja" DOUBLE PRECISION NOT NULL DEFAULT 0,
ADD COLUMN     "stockAlmacen" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockAlmacenHombre" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockAlmacenMujer" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockHombre" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "stockMinimo" INTEGER NOT NULL DEFAULT 5,
ADD COLUMN     "stockMujer" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "Customer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "customerId" TEXT,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "total" DOUBLE PRECISION NOT NULL,
    "metodoPago" "MetodoPago" NOT NULL,
    "montoRecibido" DOUBLE PRECISION,
    "cambio" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SaleItem" (
    "id" TEXT NOT NULL,
    "saleId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "descuento" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "generoVenta" TEXT,

    CONSTRAINT "SaleItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockEntry" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costo" DOUBLE PRECISION,
    "nota" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockEntry_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "categories" ADD CONSTRAINT "categories_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SaleItem" ADD CONSTRAINT "SaleItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEntry" ADD CONSTRAINT "StockEntry_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockEntry" ADD CONSTRAINT "StockEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
