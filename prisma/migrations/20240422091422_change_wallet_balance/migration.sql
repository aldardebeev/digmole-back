/*
  Warnings:

  - You are about to drop the column `amount_app_deposited` on the `wallet_balances` table. All the data in the column will be lost.
  - You are about to drop the column `amount_locked` on the `wallet_balances` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[wallet_id,ccy]` on the table `wallet_balances` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "wallet_balances" DROP COLUMN "amount_app_deposited",
DROP COLUMN "amount_locked",
ADD COLUMN     "amount_outer" DOUBLE PRECISION NOT NULL DEFAULT 0,
ALTER COLUMN "amount_app" SET DEFAULT 0;

-- CreateIndex
CREATE UNIQUE INDEX "wallet_balances_wallet_id_ccy_key" ON "wallet_balances"("wallet_id", "ccy");
