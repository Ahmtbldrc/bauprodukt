-- Add emoji column to categories table
ALTER TABLE categories 
ADD COLUMN emoji VARCHAR(10);

-- Add index for better performance (optional, emojis are usually short)
CREATE INDEX idx_categories_emoji ON categories(emoji);

-- Update existing views that include categories to include emoji field
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
  c.emoji as category_emoji,
  c.parent_id as category_parent_id
FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN categories c ON p.category_id = c.id;

-- Update the category tree function to include emoji
DROP FUNCTION IF EXISTS get_category_tree();

CREATE OR REPLACE FUNCTION get_category_tree()
RETURNS TABLE (
  id UUID,
  name VARCHAR,
  slug VARCHAR,
  emoji VARCHAR,
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
      c.emoji,
      c.parent_id,
      0 as level,
      CASE 
        WHEN c.emoji IS NOT NULL THEN c.emoji || ' ' || c.name
        ELSE c.name
      END::text as path
    FROM categories c
    WHERE c.parent_id IS NULL
    
    UNION ALL
    
    -- Recursive case: child categories
    SELECT 
      c.id,
      c.name,
      c.slug,
      c.emoji,
      c.parent_id,
      ct.level + 1,
      ct.path || ' > ' || 
      CASE 
        WHEN c.emoji IS NOT NULL THEN c.emoji || ' ' || c.name
        ELSE c.name
      END
    FROM categories c
    INNER JOIN category_tree ct ON c.parent_id = ct.id
  )
  SELECT * FROM category_tree ORDER BY path;
$$;

-- Add some sample emojis to existing categories (optional)
UPDATE categories SET emoji = '👟' WHERE slug = 'ayakkabi';
UPDATE categories SET emoji = '👕' WHERE slug = 'giyim';  
UPDATE categories SET emoji = '🎒' WHERE slug = 'aksesuar';
UPDATE categories SET emoji = '⚽' WHERE slug = 'spor';
UPDATE categories SET emoji = '🏃' WHERE slug = 'kosu-ayakkabisi';
UPDATE categories SET emoji = '👞' WHERE slug = 'gunluk-ayakkabi';
UPDATE categories SET emoji = '👕' WHERE slug = 'tisort';
UPDATE categories SET emoji = '👖' WHERE slug = 'pantolon';
UPDATE categories SET emoji = '👜' WHERE slug = 'canta';
UPDATE categories SET emoji = '🧢' WHERE slug = 'sapka'; 