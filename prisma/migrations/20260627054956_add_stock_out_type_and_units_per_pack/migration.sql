-- CreateEnum
CREATE TYPE "StockOutType" AS ENUM ('AGEN', 'KULKAS', 'SEDEKAH');

-- AlterTable
ALTER TABLE "stock_in" ADD COLUMN     "price_per_small_unit" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "remaining_stock" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "units_per_pack" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "stock_out" ADD COLUMN     "exit_type" "StockOutType" NOT NULL DEFAULT 'AGEN',
ADD COLUMN     "price_per_small_unit" DECIMAL(12,2) NOT NULL DEFAULT 0,
ADD COLUMN     "product_stock_snapshot" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "units_per_pack" INTEGER NOT NULL DEFAULT 0;
