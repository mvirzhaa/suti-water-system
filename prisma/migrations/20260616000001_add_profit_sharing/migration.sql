-- AlterTable
ALTER TABLE "refrigerators" ADD COLUMN     "profit_sharing_enabled" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "refrigerator_shares" (
    "id" TEXT NOT NULL,
    "refrigerator_id" TEXT NOT NULL,
    "instansi_name" VARCHAR(150) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refrigerator_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refrigerator_weekly_reports" (
    "id" TEXT NOT NULL,
    "refrigerator_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period_start" DATE NOT NULL,
    "period_end" DATE NOT NULL,
    "actual_revenue" DECIMAL(14,2) NOT NULL,
    "modal_cost" DECIMAL(14,2) NOT NULL,
    "net_profit" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refrigerator_weekly_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refrigerator_report_shares" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "instansi_name" VARCHAR(150) NOT NULL,
    "percentage" DECIMAL(5,2) NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "refrigerator_report_shares_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "refrigerator_shares_refrigerator_id_idx" ON "refrigerator_shares"("refrigerator_id");

-- CreateIndex
CREATE INDEX "refrigerator_weekly_reports_refrigerator_id_idx" ON "refrigerator_weekly_reports"("refrigerator_id");

-- CreateIndex
CREATE INDEX "refrigerator_weekly_reports_period_start_idx" ON "refrigerator_weekly_reports"("period_start" DESC);

-- CreateIndex
CREATE INDEX "refrigerator_report_shares_report_id_idx" ON "refrigerator_report_shares"("report_id");

-- AddForeignKey
ALTER TABLE "refrigerator_shares" ADD CONSTRAINT "refrigerator_shares_refrigerator_id_fkey" FOREIGN KEY ("refrigerator_id") REFERENCES "refrigerators"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refrigerator_weekly_reports" ADD CONSTRAINT "refrigerator_weekly_reports_refrigerator_id_fkey" FOREIGN KEY ("refrigerator_id") REFERENCES "refrigerators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refrigerator_weekly_reports" ADD CONSTRAINT "refrigerator_weekly_reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refrigerator_report_shares" ADD CONSTRAINT "refrigerator_report_shares_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "refrigerator_weekly_reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
