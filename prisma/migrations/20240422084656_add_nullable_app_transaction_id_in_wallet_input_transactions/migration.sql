-- DropForeignKey
ALTER TABLE "wallet_input_transcations" DROP CONSTRAINT "wallet_input_transcations_app_transaction_id_fkey";

-- AlterTable
ALTER TABLE "wallet_input_transcations" ALTER COLUMN "app_transaction_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "wallet_input_transcations" ADD CONSTRAINT "wallet_input_transcations_app_transaction_id_fkey" FOREIGN KEY ("app_transaction_id") REFERENCES "wallet_app_transcations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
