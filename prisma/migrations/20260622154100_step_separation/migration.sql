/*
  Warnings:

  - You are about to drop the column `recipeId` on the `InstructionStep` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[prepRecipeId,number]` on the table `InstructionStep` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[cookRecipeId,number]` on the table `InstructionStep` will be added. If there are existing duplicate values, this will fail.

*/
-- DropForeignKey
ALTER TABLE "InstructionStep" DROP CONSTRAINT "InstructionStep_recipeId_fkey";

-- DropIndex
DROP INDEX "InstructionStep_recipeId_idx";

-- DropIndex
DROP INDEX "InstructionStep_recipeId_number_key";

-- AlterTable
ALTER TABLE "InstructionStep" DROP COLUMN "recipeId",
ADD COLUMN     "cookRecipeId" TEXT,
ADD COLUMN     "prepRecipeId" TEXT;

-- CreateIndex
CREATE INDEX "InstructionStep_prepRecipeId_idx" ON "InstructionStep"("prepRecipeId");

-- CreateIndex
CREATE INDEX "InstructionStep_cookRecipeId_idx" ON "InstructionStep"("cookRecipeId");

-- CreateIndex
CREATE UNIQUE INDEX "InstructionStep_prepRecipeId_number_key" ON "InstructionStep"("prepRecipeId", "number");

-- CreateIndex
CREATE UNIQUE INDEX "InstructionStep_cookRecipeId_number_key" ON "InstructionStep"("cookRecipeId", "number");

-- AddForeignKey
ALTER TABLE "InstructionStep" ADD CONSTRAINT "InstructionStep_prepRecipeId_fkey" FOREIGN KEY ("prepRecipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InstructionStep" ADD CONSTRAINT "InstructionStep_cookRecipeId_fkey" FOREIGN KEY ("cookRecipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
