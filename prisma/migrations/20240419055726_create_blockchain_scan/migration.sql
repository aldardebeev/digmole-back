-- CreateTable
CREATE TABLE "blockchain_scan" (
    "id" SMALLSERIAL NOT NULL,
    "rod" "CcyEnum" NOT NULL,
    "last_checked_block" INTEGER NOT NULL,

    CONSTRAINT "blockchain_scan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "blockchain_scan_rod_key" ON "blockchain_scan"("rod");
