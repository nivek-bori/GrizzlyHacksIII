/*
  Warnings:

  - You are about to drop the column `profileId` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Resource` table. All the data in the column will be lost.
  - Added the required column `resourceTypeId` to the `Resource` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Resource" DROP CONSTRAINT "Resource_profileId_fkey";

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "profileId",
DROP COLUMN "type",
ADD COLUMN     "resourceTypeId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "ResourceType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "profileId" TEXT NOT NULL,

    CONSTRAINT "ResourceType_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Resource" ADD CONSTRAINT "Resource_resourceTypeId_fkey" FOREIGN KEY ("resourceTypeId") REFERENCES "ResourceType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResourceType" ADD CONSTRAINT "ResourceType_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
