-- CreateTable
CREATE TABLE "RecipeView" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "recipeId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecipeView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RecipeView_userId_viewedAt_idx" ON "RecipeView"("userId", "viewedAt");

-- CreateIndex
CREATE INDEX "RecipeView_recipeId_viewedAt_idx" ON "RecipeView"("recipeId", "viewedAt");

-- CreateIndex
CREATE INDEX "RecipeView_viewedAt_idx" ON "RecipeView"("viewedAt");

-- AddForeignKey
ALTER TABLE "RecipeView" ADD CONSTRAINT "RecipeView_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecipeView" ADD CONSTRAINT "RecipeView_recipeId_fkey" FOREIGN KEY ("recipeId") REFERENCES "Recipe"("id") ON DELETE CASCADE ON UPDATE CASCADE;
