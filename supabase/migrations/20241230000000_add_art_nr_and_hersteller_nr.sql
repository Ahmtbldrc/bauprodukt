-- Add Art-Nr and Hersteller-Nr fields to products table
-- These fields are commonly used in German-speaking countries for product identification

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS art_nr VARCHAR(100),
ADD COLUMN IF NOT EXISTS hersteller_nr VARCHAR(100);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_art_nr ON products(art_nr);
CREATE INDEX IF NOT EXISTS idx_products_hersteller_nr ON products(hersteller_nr);

-- Add comments for documentation
COMMENT ON COLUMN products.art_nr IS 'Product article number (Art-Nr)';
COMMENT ON COLUMN products.hersteller_nr IS 'Manufacturer number (Hersteller-Nr)';
