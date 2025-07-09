-- Add stock_code column to products table
ALTER TABLE products 
ADD COLUMN stock_code VARCHAR(100) UNIQUE;

-- Add index for better performance on stock_code searches
CREATE INDEX idx_products_stock_code ON products(stock_code);

-- Update the products_with_relations view to include stock_code
DROP VIEW IF EXISTS products_with_relations;

CREATE VIEW products_with_relations AS
SELECT 
  p.id,
  p.name,
  p.slug,
  p.description,
  p.price,
  p.discount_price,
  p.stock,
  p.stock_code,
  p.image_url,
  p.brand_id,
  p.category_id,
  p.created_at,
  b.name as brand_name,
  b.slug as brand_slug,
  c.name as category_name,
  c.slug as category_slug,
  c.parent_id as category_parent_id
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN categories c ON p.category_id = c.id; 