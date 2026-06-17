-- CreateTable
CREATE TABLE "kulkas_rekaps" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "rekap_date" DATE NOT NULL,
    "title" VARCHAR(150),
    "dus_sold" INTEGER NOT NULL DEFAULT 0,
    "price_per_dus" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "modal_cost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cash_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "qris_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "grand_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "net_profit" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kulkas_rekaps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kulkas_rekap_lines" (
    "id" TEXT NOT NULL,
    "rekap_id" TEXT NOT NULL,
    "refrigerator_id" TEXT,
    "label" VARCHAR(150) NOT NULL,
    "qty_500" INTEGER NOT NULL DEFAULT 0,
    "qty_1000" INTEGER NOT NULL DEFAULT 0,
    "qty_2000" INTEGER NOT NULL DEFAULT 0,
    "qty_5000" INTEGER NOT NULL DEFAULT 0,
    "qty_10000" INTEGER NOT NULL DEFAULT 0,
    "qty_20000" INTEGER NOT NULL DEFAULT 0,
    "qty_50000" INTEGER NOT NULL DEFAULT 0,
    "qty_100000" INTEGER NOT NULL DEFAULT 0,
    "cash_total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "qris_amount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "kulkas_rekap_lines_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kulkas_rekap_shares" (
    "id" TEXT NOT NULL,
    "rekap_id" TEXT NOT NULL,
    "instansi_name" VARCHAR(150) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "kulkas_rekap_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "kulkas_rekaps_rekap_date_idx" ON "kulkas_rekaps"("rekap_date" DESC);

-- CreateIndex
CREATE INDEX "kulkas_rekap_lines_rekap_id_idx" ON "kulkas_rekap_lines"("rekap_id");

-- CreateIndex
CREATE INDEX "kulkas_rekap_lines_refrigerator_id_idx" ON "kulkas_rekap_lines"("refrigerator_id");

-- CreateIndex
CREATE INDEX "kulkas_rekap_shares_rekap_id_idx" ON "kulkas_rekap_shares"("rekap_id");

-- AddForeignKey
ALTER TABLE "kulkas_rekaps" ADD CONSTRAINT "kulkas_rekaps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kulkas_rekap_lines" ADD CONSTRAINT "kulkas_rekap_lines_rekap_id_fkey" FOREIGN KEY ("rekap_id") REFERENCES "kulkas_rekaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kulkas_rekap_lines" ADD CONSTRAINT "kulkas_rekap_lines_refrigerator_id_fkey" FOREIGN KEY ("refrigerator_id") REFERENCES "refrigerators"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kulkas_rekap_shares" ADD CONSTRAINT "kulkas_rekap_shares_rekap_id_fkey" FOREIGN KEY ("rekap_id") REFERENCES "kulkas_rekaps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
