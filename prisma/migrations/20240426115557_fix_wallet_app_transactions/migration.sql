/*
  Warnings:

  - You are about to drop the column `is_deposited` on the `wallet_app_transcations` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `wallet_app_transcations` table. All the data in the column will be lost.
  - You are about to drop the column `undeposited_at` on the `wallet_app_transcations` table. All the data in the column will be lost.
  - You are about to drop the column `undepositparent_wallet_app_transaction_ided_at` on the `wallet_app_transcations` table. All the data in the column will be lost.
  - You are about to drop the column `app_transaction_id` on the `wallet_input_transcations` table. All the data in the column will be lost.
  - You are about to drop the column `app_transaction_id` on the `wallet_withdrawal_transcations` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "wallet_input_transcations" DROP CONSTRAINT "wallet_input_transcations_app_transaction_id_fkey";

-- DropForeignKey
ALTER TABLE "wallet_withdrawal_transcations" DROP CONSTRAINT "wallet_withdrawal_transcations_app_transaction_id_fkey";

-- DropIndex
DROP INDEX "wallet_input_transcations_app_transaction_id_key";

-- DropIndex
DROP INDEX "wallet_withdrawal_transcations_app_transaction_id_key";

-- AlterTable
ALTER TABLE "wallet_app_transcations" DROP COLUMN "is_deposited",
DROP COLUMN "type",
DROP COLUMN "undeposited_at",
DROP COLUMN "undepositparent_wallet_app_transaction_ided_at";

-- AlterTable
ALTER TABLE "wallet_input_transcations" DROP COLUMN "app_transaction_id";

-- AlterTable
ALTER TABLE "wallet_withdrawal_transcations" DROP COLUMN "app_transaction_id";
