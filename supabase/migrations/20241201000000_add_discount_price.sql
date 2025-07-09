-- ==========================================
-- ADD DISCOUNT PRICE TO PRODUCTS
-- ==========================================
-- İndirimli fiyat alanı ekleme

-- Products tablosuna discount_price alanı ekle
ALTER TABLE products 
ADD COLUMN discount_price DECIMAL(10,2) CHECK (discount_price >= 0);

-- İndirimli fiyat için index
CREATE INDEX idx_products_discount_price ON products(discount_price) WHERE discount_price IS NOT NULL;

-- Etkili fiyat hesaplama fonksiyonu (indirimli fiyat varsa onu, yoksa normal fiyatı döndürür)
CREATE OR REPLACE FUNCTION calculate_effective_price(
  base_price DECIMAL,
  discount_price DECIMAL
)
RETURNS DECIMAL
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN discount_price IS NOT NULL AND discount_price > 0 AND discount_price < base_price
    THEN discount_price
    ELSE base_price
  END;
$$;

-- İndirim yüzdesi hesaplama fonksiyonu
CREATE OR REPLACE FUNCTION calculate_discount_percentage(
  base_price DECIMAL,
  discount_price DECIMAL
)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT CASE 
    WHEN discount_price IS NOT NULL AND discount_price > 0 AND discount_price < base_price
    THEN ROUND(((base_price - discount_price) / base_price * 100))
    ELSE 0
  END;
$$;

-- View güncellemesi
DROP VIEW IF EXISTS products_with_relations;
CREATE VIEW products_with_relations AS
SELECT 
    p.*,
    calculate_effective_price(p.price, p.discount_price) as effective_price,
    CASE 
      WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 AND p.discount_price < p.price
      THEN true
      ELSE false
    END as has_active_discount,
    calculate_discount_percentage(p.price, p.discount_price) as discount_percentage_actual,
    CASE 
      WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 AND p.discount_price < p.price
      THEN p.price - p.discount_price
      ELSE 0
    END as discount_amount,
    b.name as brand_name,
    b.slug as brand_slug,
    c.name as category_name,
    c.slug as category_slug,
    c.parent_id as category_parent_id
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN categories c ON p.category_id = c.id;

-- Migration tamamlandı! 