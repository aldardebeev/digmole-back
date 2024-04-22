/*
  Warnings:

  - You are about to drop the column `fromAddress` on the `wallet_input_transcations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "wallet_input_transcations_fromAddress_key";

-- AlterTable
ALTER TABLE "wallet_input_transcations" DROP COLUMN "fromAddress";
