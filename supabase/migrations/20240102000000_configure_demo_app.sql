-- ==========================================
-- DEMO APP CONFIGURATION
-- ==========================================
-- Unauthorized erişim için tüm konfigürasyonları optimize et

-- ==========================================
-- VIEWS RLS (eğer gerekirse)
-- ==========================================

-- View'lar için security definer fonksiyonları
-- products_with_relations view'u için güvenlik
CREATE OR REPLACE FUNCTION get_products_with_relations()
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  description TEXT,
  price DECIMAL,
  stock INTEGER,
  image_url TEXT,
  brand_id UUID,
  category_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  brand_name VARCHAR,
  brand_slug VARCHAR,
  category_name VARCHAR,
  category_slug VARCHAR,
  category_parent_id UUID
)
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
AS $$
  SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.price,
    p.stock,
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
$$;

-- ==========================================
-- ADDITIONAL HELPER FUNCTIONS
-- ==========================================

-- Ürün resimlerini sıralı olarak getiren fonksiyon
CREATE OR REPLACE FUNCTION get_product_images(product_uuid UUID)
RETURNS TABLE (
  id UUID,
  product_id UUID,
  image_url TEXT,
  order_index INTEGER,
  is_cover BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE
)
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
AS $$
  SELECT 
    pi.id,
    pi.product_id,
    pi.image_url,
    pi.order_index,
    pi.is_cover,
    pi.created_at
  FROM product_images pi
  WHERE pi.product_id = product_uuid
  ORDER BY pi.order_index ASC, pi.created_at ASC;
$$;

-- Kategori ağacını flat olarak getiren fonksiyon
CREATE OR REPLACE FUNCTION get_category_tree()
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  parent_id UUID,
  level INTEGER,
  path TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE SQL
AS $$
  WITH RECURSIVE category_tree AS (
    -- Base case: root categories
    SELECT 
      c.id,
      c.name,
      c.slug,
      c.parent_id,
      0 as level,
      c.name::text as path
    FROM categories c
    WHERE c.parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child categories
    SELECT 
      c.id,
      c.name,
      c.slug,
      c.parent_id,
      ct.level + 1,
      ct.path || ' > ' || c.name
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
  )
  SELECT * FROM category_tree ORDER BY path;
$$;

-- ==========================================
-- DEMO DATA ENHANCEMENT
-- ==========================================

-- Daha fazla demo verisi ekle
INSERT INTO products (name, slug, description, price, stock, brand_id, category_id) VALUES
(
  'Vans Old Skool',
  'vans-old-skool',
  'Klasik skate ayakkabısı. Günlük kullanım için mükemmel.',
  549.99,
  75,
  (SELECT id FROM brands WHERE slug = 'vans'),
  (SELECT id FROM categories WHERE slug = 'gunluk-ayakkabi')
),
(
  'Puma Suede Classic',
  'puma-suede-classic',
  'Retro tarzı süet ayakkabı. Şık ve rahat.',
  699.99,
  60,
  (SELECT id FROM brands WHERE slug = 'puma'),
  (SELECT id FROM categories WHERE slug = 'gunluk-ayakkabi')
),
(
  'New Balance 574',
  'new-balance-574',
  'Rahat ve şık lifestyle ayakkabısı.',
  799.99,
  40,
  (SELECT id FROM brands WHERE slug = 'new-balance'),
  (SELECT id FROM categories WHERE slug = 'gunluk-ayakkabi')
),
(
  'Adidas Trefoil Tişört',
  'adidas-trefoil-tisort',
  'Klasik Adidas logosu ile pamuklu tişört.',
  149.99,
  120,
  (SELECT id FROM brands WHERE slug = 'adidas'),
  (SELECT id FROM categories WHERE slug = 'tisort')
),
(
  'Nike Sportswear Jogger',
  'nike-sportswear-jogger',
  'Rahat günlük kullanım için jogger pantolon.',
  299.99,
  80,
  (SELECT id FROM brands WHERE slug = 'nike'),
  (SELECT id FROM categories WHERE slug = 'pantolon')
)
ON CONFLICT (slug) DO NOTHING;

-- Daha fazla banner ekle
INSERT INTO banners (title, image_url, link, order_index, is_active) VALUES
('Spor Ayakkabı Koleksiyonu', 'https://picsum.photos/1200/400?random=1', '/categories/kosu-ayakkabisi', 3, true),
('Yazlık Ürünler', 'https://picsum.photos/1200/400?random=2', '/categories/tisort', 4, true)
ON CONFLICT DO NOTHING;

-- ==========================================
-- PERFORMANCE OPTIMIZATION
-- ==========================================

-- Sık kullanılan sorguları hızlandırmak için ek indexler
CREATE INDEX IF NOT EXISTS idx_products_active 
ON products(id) 
WHERE stock > 0;

CREATE INDEX IF NOT EXISTS idx_products_brand_category_stock 
ON products(brand_id, category_id, stock) 
WHERE stock > 0;

CREATE INDEX IF NOT EXISTS idx_banners_active_display 
ON banners(order_index, is_active) 
WHERE is_active = true;

-- Text search için ek indexler
CREATE INDEX IF NOT EXISTS idx_products_description_gin 
ON products USING GIN (description gin_trgm_ops) 
WHERE description IS NOT NULL;

-- ==========================================
-- CONFIGURATION COMPLETE
-- ==========================================

-- Demo app konfigürasyonu tamamlandı!
-- - Tüm RLS policy'leri zaten unauthorized erişim için ayarlanmış
-- - Yardımcı fonksiyonlar eklendi
-- - Ek demo verisi eklendi
-- - Performance optimizasyonları yapıldı 