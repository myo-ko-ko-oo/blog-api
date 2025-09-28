/*
  Warnings:

  - You are about to drop the column `slug` on the `Category` table. All the data in the column will be lost.
  - You are about to alter the column `email` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(52)`.
  - You are about to alter the column `name` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(52)`.
  - Added the required column `authorName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "public"."Status" AS ENUM ('ACTIVE', 'INACTIVE', 'FREEZE');

-- CreateEnum
CREATE TYPE "public"."Type" AS ENUM ('MM', 'ENG');

-- DropIndex
DROP INDEX "public"."Category_slug_key";

-- AlterTable
ALTER TABLE "public"."Category" DROP COLUMN "slug",
ADD COLUMN     "type" "public"."Type" NOT NULL DEFAULT 'ENG',
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "type" "public"."Type" NOT NULL DEFAULT 'ENG';

-- AlterTable
ALTER TABLE "public"."Tag" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "acessToken" TEXT,
ADD COLUMN     "authorName" VARCHAR(52) NOT NULL,
ADD COLUMN     "errorLoginCount" SMALLINT NOT NULL DEFAULT 0,
ADD COLUMN     "imageUrl" TEXT,
ADD COLUMN     "lastLogin" TIMESTAMP(3),
ADD COLUMN     "status" "public"."Status" NOT NULL DEFAULT 'ACTIVE',
ALTER COLUMN "email" SET DATA TYPE VARCHAR(52),
ALTER COLUMN "name" SET DATA TYPE VARCHAR(52);

-- CreateTable
CREATE TABLE "public"."Config" (
    "id" SERIAL NOT NULL,
    "homeTitle" VARCHAR(52) NOT NULL,
    "homeDescription" TEXT NOT NULL,
    "aboutTitle" VARCHAR(52) NOT NULL,
    "aboutDescription" TEXT NOT NULL,
    "contactEmail" VARCHAR(52) NOT NULL,
    "contactPhone" VARCHAR(15) NOT NULL,
    "contactAddress" VARCHAR(52) NOT NULL,

    CONSTRAINT "Config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Contact" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(52) NOT NULL,
    "email" VARCHAR(52) NOT NULL,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Subscribe" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(52) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscribe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Setting" (
    "id" SERIAL NOT NULL,
    "key" VARCHAR(50) NOT NULL,
    "value" VARCHAR(200) NOT NULL,

    CONSTRAINT "Setting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Subscribe_email_key" ON "public"."Subscribe"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "public"."Setting"("key");
