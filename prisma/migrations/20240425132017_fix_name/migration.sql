/*
  Warnings:

  - You are about to drop the column `wallet_game_trancation_id` on the `wallet_game_session_transcations` table. All the data in the column will be lost.
  - Added the required column `wallet_game_transation_id` to the `wallet_game_session_transcations` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "wallet_game_session_transcations" DROP CONSTRAINT "wallet_game_session_transcations_wallet_game_trancation_id_fkey";

-- AlterTable
ALTER TABLE "wallet_game_session_transcations" DROP COLUMN "wallet_game_trancation_id",
ADD COLUMN     "wallet_game_transation_id" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "wallet_game_session_transcations" ADD CONSTRAINT "wallet_game_session_transcations_wallet_game_transation_id_fkey" FOREIGN KEY ("wallet_game_transation_id") REFERENCES "wallet_game_transcations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
