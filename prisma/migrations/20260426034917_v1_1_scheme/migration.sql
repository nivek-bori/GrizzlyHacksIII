/*
  Warnings:

  - You are about to drop the column `requiredResources` on the `Profile` table. All the data in the column will be lost.
  - You are about to drop the column `rating` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the `_ProfilePotentialResources` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `profileId` to the `Resource` table without a default value. This is not possible if the table is not empty.
  - Added the required column `status` to the `Resource` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "ResourceStatus" AS ENUM ('SUGGESTED', 'POTENTIAL', 'CHOSEN', 'BOUGHT');

-- DropForeignKey
ALTER TABLE "_ProfilePotentialResources" DROP CONSTRAINT "_ProfilePotentialResources_A_fkey";

-- DropForeignKey
ALTER TABLE "_ProfilePotentialResources" DROP CONSTRAINT "_ProfilePotentialResources_B_fkey";

-- AlterTable
ALTER TABLE "Profile" DROP COLUMN "requiredResources";

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "rating",
ADD COLUMN     "profileId" TEXT NOT NULL,
ADD COLUMN     "status" "ResourceStatus" NOT NULL,
ALTER COLUMN "time" DROP NOT NULL;

-- DropTable
DROP TABLE "_ProfilePotentialResources";

-- CreateTable
CREATE TABLE "EventDescription" (
    "id" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,
    "location" TEXT,
    "time" TIMESTAMP(3),
    "budget" DOUBLE PRECISION,
    "extraNotes" TEXT NOT NULL,

    CONSTRAINT "EventDescription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventDescription_profileId_key" ON "EventDescription"("profileId");

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventDescription" ADD CONSTRAINT "EventDescription_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
