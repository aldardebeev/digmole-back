-- CreateTable
CREATE TABLE "wallet_game_transcations" (
    "id" SMALLSERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "ccy" "CcyEnum" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tx" TEXT NOT NULL,
    "is_winner" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_game_transcations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_game_session_transcations" (
    "id" SMALLSERIAL NOT NULL,
    "wallet_game_trancation_id" INTEGER NOT NULL,
    "ccy" "CcyEnum" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tx" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_game_session_transcations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "wallet_game_transcations_id_idx" ON "wallet_game_transcations"("id");

-- CreateIndex
CREATE INDEX "wallet_game_session_transcations_id_idx" ON "wallet_game_session_transcations"("id");

-- AddForeignKey
ALTER TABLE "wallet_game_transcations" ADD CONSTRAINT "wallet_game_transcations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_game_session_transcations" ADD CONSTRAINT "wallet_game_session_transcations_wallet_game_trancation_id_fkey" FOREIGN KEY ("wallet_game_trancation_id") REFERENCES "wallet_game_transcations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
