/*
  Warnings:

  - A unique constraint covering the columns `[tx]` on the table `wallet_input_transcations` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "wallet_input_transcations" ALTER COLUMN "tx" SET DATA TYPE TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "wallet_input_transcations_tx_key" ON "wallet_input_transcations"("tx");
