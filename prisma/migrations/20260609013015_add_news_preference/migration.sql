-- CreateTable
CREATE TABLE "NewsPreference" (
    "id" TEXT NOT NULL,
    "enabledSources" TEXT[],
    "userId" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsPreference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "NewsPreference_userId_key" ON "NewsPreference"("userId");

-- AddForeignKey
ALTER TABLE "NewsPreference" ADD CONSTRAINT "NewsPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
