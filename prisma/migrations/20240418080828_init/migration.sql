-- CreateEnum
CREATE TYPE "CcyEnum" AS ENUM ('rod');

-- CreateEnum
CREATE TYPE "TransactionTypeEnum" AS ENUM ('REPLENISHMENT', 'WITHDRAWAL', 'GAME');

-- CreateTable
CREATE TABLE "users" (
    "id" SMALLSERIAL NOT NULL,
    "chat_id" VARCHAR(256) NOT NULL,
    "username" VARCHAR(256) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallets" (
    "id" SMALLSERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "address" VARCHAR(256) NOT NULL,
    "signature_phrase" VARCHAR(256),

    CONSTRAINT "wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_balances" (
    "id" SMALLSERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "ccy" "CcyEnum" NOT NULL,
    "amount_app" DOUBLE PRECISION NOT NULL,
    "amount_app_deposited" DOUBLE PRECISION NOT NULL,
    "amount_locked" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "wallet_balances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_app_transcations" (
    "id" SMALLSERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "ccy" "CcyEnum" NOT NULL,
    "type" "TransactionTypeEnum" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "is_deposited" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "undeposited_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "undepositparent_wallet_app_transaction_ided_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_app_transcations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_input_transcations" (
    "id" SMALLSERIAL NOT NULL,
    "wallet_id" INTEGER NOT NULL,
    "ccy" "CcyEnum" NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "fromAddress" VARCHAR(256) NOT NULL,
    "tx" VARCHAR(256) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "app_transaction_id" INTEGER NOT NULL,
    "checked_at" TIMESTAMP(3) NOT NULL,
    "closed_at" TIMESTAMP(3) NOT NULL,
    "reason_for_closed" VARCHAR(256) NOT NULL,

    CONSTRAINT "wallet_input_transcations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "users_id_idx" ON "users"("id");

-- CreateIndex
CREATE UNIQUE INDEX "wallets_user_id_key" ON "wallets"("user_id");

-- CreateIndex
CREATE INDEX "wallets_id_idx" ON "wallets"("id");

-- CreateIndex
CREATE INDEX "wallet_balances_id_idx" ON "wallet_balances"("id");

-- CreateIndex
CREATE INDEX "wallet_app_transcations_id_idx" ON "wallet_app_transcations"("id");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_input_transcations_app_transaction_id_key" ON "wallet_input_transcations"("app_transaction_id");

-- CreateIndex
CREATE INDEX "wallet_input_transcations_id_idx" ON "wallet_input_transcations"("id");

-- AddForeignKey
ALTER TABLE "wallets" ADD CONSTRAINT "wallets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_balances" ADD CONSTRAINT "wallet_balances_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_app_transcations" ADD CONSTRAINT "wallet_app_transcations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_input_transcations" ADD CONSTRAINT "wallet_input_transcations_wallet_id_fkey" FOREIGN KEY ("wallet_id") REFERENCES "wallets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_input_transcations" ADD CONSTRAINT "wallet_input_transcations_app_transaction_id_fkey" FOREIGN KEY ("app_transaction_id") REFERENCES "wallet_app_transcations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
