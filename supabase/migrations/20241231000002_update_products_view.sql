-- ==========================================
-- FIX PRODUCTS_WITH_RELATIONS VIEW
-- ==========================================
-- Add back the missing calculated fields for discount pricing

-- Drop and recreate the products_with_relations view with proper discount calculations
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
    
    -- Brand information
    b.name as brand_name,
    b.slug as brand_slug,
    
    -- Category information
    c.name as category_name,
    c.slug as category_slug,
    c.emoji as category_emoji,
    c.parent_id as category_parent_id,
    
    -- Calculated discount fields
    CASE 
        WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 AND p.discount_price < p.price
        THEN p.discount_price
        ELSE p.price
    END as effective_price,
    
    CASE 
        WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 AND p.discount_price < p.price
        THEN true
        ELSE false
    END as has_active_discount,
    
    CASE 
        WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 AND p.discount_price < p.price
        THEN ROUND(((p.price - p.discount_price) / p.price * 100)::numeric, 2)
        ELSE 0
    END as discount_percentage_actual,
    
    CASE 
        WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 AND p.discount_price < p.price
        THEN (p.price - p.discount_price)
        ELSE 0
    END as discount_amount

FROM products p
LEFT JOIN brands b ON p.brand_id = b.id
LEFT JOIN categories c ON p.category_id = c.id;

-- Add comment to the view
COMMENT ON VIEW products_with_relations IS 'Products with brand, category, and calculated discount information';

-- Migration completed!
