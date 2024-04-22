-- AlterTable
ALTER TABLE "wallet_input_transcations" ALTER COLUMN "closed_at" DROP NOT NULL,
ALTER COLUMN "reason_for_closed" DROP NOT NULL;
