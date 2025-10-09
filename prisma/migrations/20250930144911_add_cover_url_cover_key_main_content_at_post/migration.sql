/*
  Warnings:

  - Added the required column `coverKey` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `coverUrl` to the `Post` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mainContent` to the `Post` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "public"."Post" ADD COLUMN     "coverKey" TEXT NOT NULL,
ADD COLUMN     "coverUrl" TEXT NOT NULL,
ADD COLUMN     "mainContent" TEXT NOT NULL;
