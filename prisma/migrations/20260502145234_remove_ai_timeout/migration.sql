/*
  Warnings:

  - You are about to drop the column `AITimeout` on the `EventDescription` table. All the data in the column will be lost.
  - You are about to drop the column `AITimeout` on the `Resource` table. All the data in the column will be lost.
  - You are about to drop the column `AITimeout` on the `ResourceType` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "EventDescription" DROP COLUMN "AITimeout";

-- AlterTable
ALTER TABLE "Resource" DROP COLUMN "AITimeout";

-- AlterTable
ALTER TABLE "ResourceType" DROP COLUMN "AITimeout";
