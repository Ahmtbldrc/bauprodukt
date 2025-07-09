-- ==========================================
-- BAUPRODUKT DEMO - INITIAL DATABASE MIGRATION
-- ==========================================
-- Bu script tüm database yapısını sıfırdan oluşturur
-- Supabase için optimize edilmiştir

-- ==========================================
-- EXTENSIONS
-- ==========================================

-- UUID extension'ı aktifleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Trigram extension'ı aktifleştir (text search için)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ==========================================
-- BRANDS TABLE
-- ==========================================

CREATE TABLE brands (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Brands tablosu için indexler
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_name ON brands(name);
CREATE INDEX idx_brands_created_at ON brands(created_at);

-- Brands tablosu için RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;

-- Brands için public access policy'leri
CREATE POLICY "Enable read access for all users" ON brands FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON brands FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON brands FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON brands FOR DELETE USING (true);

-- ==========================================
-- CATEGORIES TABLE
-- ==========================================

CREATE TABLE categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories tablosu için indexler
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_name ON categories(name);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_created_at ON categories(created_at);

-- Hierarchical queries için composite index
CREATE INDEX idx_categories_parent_name ON categories(parent_id, name);

-- Categories tablosu için RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Categories için public access policy'leri
CREATE POLICY "Enable read access for all users" ON categories FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON categories FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON categories FOR DELETE USING (true);

-- ==========================================
-- PRODUCTS TABLE
-- ==========================================

CREATE TABLE products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    image_url TEXT,
    brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
    category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Products tablosu için indexler
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_price ON products(price);
CREATE INDEX idx_products_stock ON products(stock);
CREATE INDEX idx_products_created_at ON products(created_at);

-- Filtering için composite indexler
CREATE INDEX idx_products_brand_category ON products(brand_id, category_id);
CREATE INDEX idx_products_category_price ON products(category_id, price);
CREATE INDEX idx_products_brand_price ON products(brand_id, price);

-- Text search için trigram index (extension yüklendikten sonra)
CREATE INDEX idx_products_name_gin ON products USING GIN (name gin_trgm_ops);

-- Products tablosu için RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products için public access policy'leri
CREATE POLICY "Enable read access for all users" ON products FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON products FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON products FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON products FOR DELETE USING (true);

-- ==========================================
-- BANNERS TABLE
-- ==========================================

CREATE TABLE banners (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(255),
    image_url TEXT NOT NULL,
    link TEXT,
    order_index INTEGER NOT NULL DEFAULT 0 CHECK (order_index >= 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Banners tablosu için indexler
CREATE INDEX idx_banners_order_index ON banners(order_index);
CREATE INDEX idx_banners_is_active ON banners(is_active);
CREATE INDEX idx_banners_created_at ON banners(created_at);

-- Active banners için composite index
CREATE INDEX idx_banners_active_order ON banners(is_active, order_index) WHERE is_active = true;

-- Banners tablosu için RLS
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Banners için public access policy'leri
CREATE POLICY "Enable read access for all users" ON banners FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON banners FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON banners FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON banners FOR DELETE USING (true);

-- ==========================================
-- PRODUCT_IMAGES TABLE
-- ==========================================

CREATE TABLE product_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product_images tablosu için indexler
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_created_at ON product_images(created_at);

-- Product_images tablosu için RLS
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;

-- Product_images için public access policy'leri
CREATE POLICY "Enable read access for all users" ON product_images FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON product_images FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON product_images FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON product_images FOR DELETE USING (true);

-- ==========================================
-- USEFUL VIEWS
-- ==========================================

-- Products with their related data
CREATE VIEW products_with_relations AS
SELECT 
    p.*,
    b.name as brand_name,
    b.slug as brand_slug,
    c.name as category_name,
    c.slug as category_slug,
    c.parent_id as category_parent_id
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN categories c ON p.category_id = c.id;

-- Category hierarchy view (simplified)
CREATE VIEW category_hierarchy AS
WITH RECURSIVE category_tree AS (
    -- Base case: root categories
    SELECT 
        id,
        name,
        slug,
        parent_id,
        0 as level
    FROM categories 
    WHERE parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child categories
    SELECT 
        c.id,
        c.name,
        c.slug,
        c.parent_id,
        ct.level + 1
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT * FROM category_tree;

-- Active banners ordered view
CREATE VIEW active_banners AS
SELECT *
FROM banners
WHERE is_active = true
ORDER BY order_index ASC;

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to generate slug from text
CREATE OR REPLACE FUNCTION generate_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
    RETURN lower(
        regexp_replace(
            regexp_replace(
                trim(input_text),
                '[^a-zA-Z0-9\s-]', '', 'g'
            ),
            '\s+', '-', 'g'
        )
    );
END;
$$ LANGUAGE plpgsql;

-- Function to get category with all children
CREATE OR REPLACE FUNCTION get_category_with_children(category_uuid UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    slug VARCHAR,
    parent_id UUID,
    level INTEGER
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE category_tree AS (
        -- Base case: the specified category
        SELECT 
            c.id,
            c.name,
            c.slug,
            c.parent_id,
            0 as level
        FROM categories c
        WHERE c.id = category_uuid
        
        UNION ALL
        
        -- Recursive case: child categories
        SELECT 
            c.id,
            c.name,
            c.slug,
            c.parent_id,
            ct.level + 1
        FROM categories c
        INNER JOIN category_tree ct ON c.parent_id = ct.id
    )
    SELECT 
        ct.id,
        ct.name,
        ct.slug,
        ct.parent_id,
        ct.level
    FROM category_tree ct;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- SAMPLE DATA (Optional - Remove if not needed)
-- ==========================================

-- Sample brands
INSERT INTO brands (name, slug) VALUES
('Nike', 'nike'),
('Adidas', 'adidas'),
('Puma', 'puma'),
('New Balance', 'new-balance'),
('Vans', 'vans');

-- Sample root categories
INSERT INTO categories (name, slug) VALUES
('Ayakkabı', 'ayakkabi'),
('Giyim', 'giyim'),
('Aksesuar', 'aksesuar'),
('Spor', 'spor');

-- Sample subcategories
INSERT INTO categories (name, slug, parent_id) VALUES
('Koşu Ayakkabısı', 'kosu-ayakkabisi', (SELECT id FROM categories WHERE slug = 'ayakkabi')),
('Günlük Ayakkabı', 'gunluk-ayakkabi', (SELECT id FROM categories WHERE slug = 'ayakkabi')),
('Tişört', 'tisort', (SELECT id FROM categories WHERE slug = 'giyim')),
('Pantolon', 'pantolon', (SELECT id FROM categories WHERE slug = 'giyim')),
('Çanta', 'canta', (SELECT id FROM categories WHERE slug = 'aksesuar')),
('Şapka', 'sapka', (SELECT id FROM categories WHERE slug = 'aksesuar'));

-- Sample products
INSERT INTO products (name, slug, description, price, stock, brand_id, category_id) VALUES
(
    'Nike Air Max 270',
    'nike-air-max-270',
    'Rahat ve şık koşu ayakkabısı. Günlük kullanım için ideal.',
    899.99,
    50,
    (SELECT id FROM brands WHERE slug = 'nike'),
    (SELECT id FROM categories WHERE slug = 'kosu-ayakkabisi')
),
(
    'Adidas Ultraboost 22',
    'adidas-ultraboost-22',
    'Yüksek performanslı koşu ayakkabısı. Profesyonel sporcular için tasarlandı.',
    1299.99,
    30,
    (SELECT id FROM brands WHERE slug = 'adidas'),
    (SELECT id FROM categories WHERE slug = 'kosu-ayakkabisi')
),
(
    'Nike Dri-FIT Tişört',
    'nike-dri-fit-tisort',
    'Nefes alabilir kumaş teknolojisi ile üretilmiş spor tişörtü.',
    199.99,
    100,
    (SELECT id FROM brands WHERE slug = 'nike'),
    (SELECT id FROM categories WHERE slug = 'tisort')
);

-- Sample banners
INSERT INTO banners (title, image_url, link, order_index, is_active) VALUES
('Yeni Sezon İndirimi', 'https://example.com/banner1.jpg', 'https://example.com/sale', 0, true),
('Nike Koleksiyonu', 'https://example.com/banner2.jpg', 'https://example.com/nike', 1, true),
('Ücretsiz Kargo', 'https://example.com/banner3.jpg', 'https://example.com/shipping', 2, false);

-- ==========================================
-- MIGRATION COMPLETE
-- ==========================================

-- Migration başarıyla tamamlandı!
-- Tablolar: brands, categories, products, banners, product_images
-- RLS Policy'leri: Tüm tablolar için public access
-- Indexler: Performans için optimize edilmiş indexler (trigram dahil)
-- Views: Yararlı view'lar oluşturuldu
-- Functions: Yardımcı fonksiyonlar eklendi
-- Sample Data: Test için örnek veriler eklendi 