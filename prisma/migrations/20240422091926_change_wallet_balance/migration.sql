/*
  Warnings:

  - You are about to drop the column `amount_outer` on the `wallet_balances` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "wallet_balances" DROP COLUMN "amount_outer",
ADD COLUMN     "amount_external" DOUBLE PRECISION NOT NULL DEFAULT 0;
