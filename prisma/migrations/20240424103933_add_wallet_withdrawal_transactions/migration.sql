/*
  Warnings:

  - You are about to drop the `blockchain_scan` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "blockchain_scan";

-- CreateTable
CREATE TABLE "wallet_withdrawal_transcations" (
    "id" SMALLSERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "address_to" TEXT NOT NULL,
    "ccy" "CcyEnum" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tx" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "app_transaction_id" INTEGER,
    "checked_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "reason_for_closed" VARCHAR(256),

    CONSTRAINT "wallet_withdrawal_transcations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "wallet_withdrawal_transcations_tx_key" ON "wallet_withdrawal_transcations"("tx");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_withdrawal_transcations_app_transaction_id_key" ON "wallet_withdrawal_transcations"("app_transaction_id");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_transcations_id_idx" ON "wallet_withdrawal_transcations"("id");

-- AddForeignKey
ALTER TABLE "wallet_withdrawal_transcations" ADD CONSTRAINT "wallet_withdrawal_transcations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_withdrawal_transcations" ADD CONSTRAINT "wallet_withdrawal_transcations_app_transaction_id_fkey" FOREIGN KEY ("app_transaction_id") REFERENCES "wallet_app_transcations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
