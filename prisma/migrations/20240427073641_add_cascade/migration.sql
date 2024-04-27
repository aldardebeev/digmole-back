-- DropForeignKey
ALTER TABLE "wallet_app_transcations" DROP CONSTRAINT "wallet_app_transcations_wallet_id_fkey";

-- DropForeignKey
ALTER TABLE "wallet_balances" DROP CONSTRAINT "wallet_balances_wallet_id_fkey";

-- DropForeignKey
ALTER TABLE "wallet_game_session_transcations" DROP CONSTRAINT "wallet_game_session_transcations_wallet_game_transation_id_fkey";

-- DropForeignKey
ALTER TABLE "wallet_game_transcations" DROP CONSTRAINT "wallet_game_transcations_wallet_id_fkey";

-- DropForeignKey
ALTER TABLE "wallet_input_transcations" DROP CONSTRAINT "wallet_input_transcations_wallet_id_fkey";

-- DropForeignKey
ALTER TABLE "wallet_withdrawal_transcations" DROP CONSTRAINT "wallet_withdrawal_transcations_wallet_id_fkey";

-- DropForeignKey
ALTER TABLE "wallets" DROP CONSTRAINT "wallets_user_id_fkey";

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_balances" ADD CONSTRAINT "wallet_balances_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_app_transcations" ADD CONSTRAINT "wallet_app_transcations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_input_transcations" ADD CONSTRAINT "wallet_input_transcations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_withdrawal_transcations" ADD CONSTRAINT "wallet_withdrawal_transcations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_game_transcations" ADD CONSTRAINT "wallet_game_transcations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_game_session_transcations" ADD CONSTRAINT "wallet_game_session_transcations_wallet_game_transation_id_fkey" FOREIGN KEY ("wallet_game_transation_id") REFERENCES "wallet_game_transcations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
