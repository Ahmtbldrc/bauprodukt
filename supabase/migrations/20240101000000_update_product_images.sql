-- ==========================================
-- PRODUCT IMAGES UPDATE MIGRATION
-- ==========================================
-- Ürün görselleri için sıralama ve cover sistemi

-- Product_images tablosuna yeni alanlar ekle
ALTER TABLE product_images 
ADD COLUMN order_index INTEGER DEFAULT 0,
ADD COLUMN is_cover BOOLEAN DEFAULT false;

-- Indexler ekle
CREATE INDEX idx_product_images_order ON product_images(product_id, order_index);
CREATE INDEX idx_product_images_cover ON product_images(product_id) WHERE is_cover = true;

-- KRITIK: Her ürün için sadece 1 cover constraint'i
CREATE UNIQUE INDEX idx_product_images_unique_cover 
ON product_images (product_id) 
WHERE is_cover = true;

-- Mevcut kayıtlar için default değerleri ayarla
-- İlk eklenen resim cover olacak
UPDATE product_images 
SET order_index = 0, 
    is_cover = true 
WHERE id IN (
    SELECT DISTINCT ON (product_id) id 
    FROM product_images 
    ORDER BY product_id, created_at ASC
);

-- Diğer resimlere sıralı index ver
WITH ranked_images AS (
    SELECT 
        id,
        product_id,
        ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY created_at) - 1 as row_num
    FROM product_images
)
UPDATE product_images 
SET order_index = ranked_images.row_num
FROM ranked_images 
WHERE product_images.id = ranked_images.id; 