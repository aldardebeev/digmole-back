-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "chat_id" TEXT NOT NULL,
    "username" VARCHAR(256) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "address" TEXT NOT NULL,
    "signature_phrase" VARCHAR(256),

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_balances" (
    "id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "ccy" TEXT NOT NULL,
    "amount_app" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "amount_external" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "wallet_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_app_transcations" (
    "id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "ccy" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_app_transcations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_input_transcations" (
    "id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "ccy" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tx" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "checked_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "reason_for_closed" VARCHAR(256),

    CONSTRAINT "wallet_input_transcations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_withdrawal_transcations" (
    "id" SERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "address_to" TEXT NOT NULL,
    "ccy" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tx" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "checked_at" TIMESTAMP(3),
    "closed_at" TIMESTAMP(3),
    "reason_for_closed" VARCHAR(256),

    CONSTRAINT "wallet_withdrawal_transcations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_game_transcations" (
    "id" SERIAL NOT NULL,
    "creator_wallet_id" INTEGER NOT NULL,
    "subscribe_wallet_id" INTEGER,
    "ccy" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tx" TEXT,
    "winner" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_game_transcations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_game_session_transcations" (
    "id" SERIAL NOT NULL,
    "wallet_game_transaction_id" INTEGER NOT NULL,
    "ccy" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "tx" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_game_session_transcations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_chat_id_key" ON "users"("chat_id");

-- CreateIndex
CREATE INDEX "users_id_idx" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_address_key" ON "wallets"("address");

-- CreateIndex
CREATE INDEX "wallets_id_idx" ON "wallets"("id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_balances_wallet_id_key" ON "wallet_balances"("wallet_id");

-- CreateIndex
CREATE INDEX "wallet_balances_id_idx" ON "wallet_balances"("id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_balances_wallet_id_ccy_key" ON "wallet_balances"("wallet_id", "ccy");

-- CreateIndex
CREATE INDEX "wallet_app_transcations_id_idx" ON "wallet_app_transcations"("id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_input_transcations_tx_key" ON "wallet_input_transcations"("tx");

-- CreateIndex
CREATE INDEX "wallet_input_transcations_id_idx" ON "wallet_input_transcations"("id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_withdrawal_transcations_tx_key" ON "wallet_withdrawal_transcations"("tx");

-- CreateIndex
CREATE INDEX "wallet_withdrawal_transcations_id_idx" ON "wallet_withdrawal_transcations"("id");

-- CreateIndex
CREATE INDEX "wallet_game_transcations_id_idx" ON "wallet_game_transcations"("id");

-- CreateIndex
CREATE INDEX "wallet_game_session_transcations_id_idx" ON "wallet_game_session_transcations"("id");

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
ALTER TABLE "wallet_game_transcations" ADD CONSTRAINT "wallet_game_transcations_creator_wallet_id_fkey" FOREIGN KEY ("creator_wallet_id") REFERENCES "wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_game_session_transcations" ADD CONSTRAINT "wallet_game_session_transcations_wallet_game_transaction_i_fkey" FOREIGN KEY ("wallet_game_transaction_id") REFERENCES "wallet_game_transcations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
