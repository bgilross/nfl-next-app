-- CreateTable
CREATE TABLE "public"."Team" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."Category" (
    "id" SERIAL NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."StatSnapshot" (
    "id" SERIAL NOT NULL,
    "teamId" INTEGER NOT NULL,
    "categoryId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seasonYear" INTEGER,
    "currentYear" INTEGER,
    "prevYear" INTEGER,
    "valueCurrent" DOUBLE PRECISION,
    "valuePrev" DOUBLE PRECISION,
    "last1" DOUBLE PRECISION,
    "last3" DOUBLE PRECISION,
    "home" DOUBLE PRECISION,
    "away" DOUBLE PRECISION,
    "rank" INTEGER,

    CONSTRAINT "StatSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Team_name_key" ON "public"."Team"("name");

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "public"."Category"("slug");

-- CreateIndex
CREATE INDEX "StatSnapshot_category_season_idx" ON "public"."StatSnapshot"("categoryId", "seasonYear");

-- CreateIndex
CREATE INDEX "StatSnapshot_team_category_created_idx" ON "public"."StatSnapshot"("teamId", "categoryId", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."StatSnapshot" ADD CONSTRAINT "StatSnapshot_category_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."Category"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."StatSnapshot" ADD CONSTRAINT "StatSnapshot_team_fkey" FOREIGN KEY ("teamId") REFERENCES "public"."Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
