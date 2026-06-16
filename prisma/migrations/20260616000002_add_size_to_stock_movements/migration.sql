-- AlterTable
ALTER TABLE "stock_in" ADD COLUMN     "size" VARCHAR(20);

-- AlterTable
ALTER TABLE "stock_out" ADD COLUMN     "size" VARCHAR(20);

-- CreateIndex
CREATE INDEX "stock_in_size_idx" ON "stock_in"("size");

-- CreateIndex
CREATE INDEX "stock_out_size_idx" ON "stock_out"("size");
