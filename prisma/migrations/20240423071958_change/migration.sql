/*
  Warnings:

  - A unique constraint covering the columns `[wallet_id]` on the table `wallet_balances` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "wallet_balances_wallet_id_key" ON "wallet_balances"("wallet_id");
