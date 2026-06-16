-- CreateTable
CREATE TABLE "refrigerators" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(150) NOT NULL,
    "location" VARCHAR(150),
    "code" VARCHAR(50),
    "description" TEXT,
    "image_url" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "refrigerators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refrigerator_fills" (
    "id" TEXT NOT NULL,
    "refrigerator_id" TEXT NOT NULL,
    "product_id" TEXT,
    "user_id" TEXT NOT NULL,
    "fill_date" DATE NOT NULL,
    "box_count" INTEGER NOT NULL,
    "bottles_per_box" INTEGER NOT NULL DEFAULT 0,
    "price_per_box" DECIMAL(12,2) NOT NULL,
    "price_per_bottle" DECIMAL(12,2) NOT NULL,
    "total_bottles" INTEGER NOT NULL DEFAULT 0,
    "total_cost" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refrigerator_fills_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "refrigerators_code_key" ON "refrigerators"("code");

-- CreateIndex
CREATE INDEX "refrigerators_is_active_idx" ON "refrigerators"("is_active");

-- CreateIndex
CREATE INDEX "refrigerators_name_idx" ON "refrigerators"("name");

-- CreateIndex
CREATE INDEX "refrigerator_fills_refrigerator_id_idx" ON "refrigerator_fills"("refrigerator_id");

-- CreateIndex
CREATE INDEX "refrigerator_fills_product_id_idx" ON "refrigerator_fills"("product_id");

-- CreateIndex
CREATE INDEX "refrigerator_fills_fill_date_idx" ON "refrigerator_fills"("fill_date" DESC);

-- AddForeignKey
ALTER TABLE "refrigerators" ADD CONSTRAINT "refrigerators_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refrigerator_fills" ADD CONSTRAINT "refrigerator_fills_refrigerator_id_fkey" FOREIGN KEY ("refrigerator_id") REFERENCES "refrigerators"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refrigerator_fills" ADD CONSTRAINT "refrigerator_fills_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refrigerator_fills" ADD CONSTRAINT "refrigerator_fills_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
