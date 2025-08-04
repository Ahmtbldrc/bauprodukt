-- ==========================================
-- PRODUCT VARIANT SYSTEM MIGRATION
-- ==========================================
-- Product variant system: attributes, variants, and variant-attribute relationships

-- ==========================================
-- PRODUCT ATTRIBUTES TABLE
-- ==========================================

CREATE TYPE attribute_type AS ENUM ('select', 'text', 'number');

CREATE TABLE product_attributes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL, -- Normalized attribute name (e.g., 'color', 'size')
    display_name VARCHAR(100) NOT NULL, -- User-friendly display name (e.g., 'Color', 'Size')
    attribute_type attribute_type NOT NULL DEFAULT 'select',
    is_required BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product attributes indexes
CREATE INDEX idx_product_attributes_name ON product_attributes(name);
CREATE INDEX idx_product_attributes_sort_order ON product_attributes(sort_order);
CREATE INDEX idx_product_attributes_type ON product_attributes(attribute_type);

-- Product attributes RLS
ALTER TABLE product_attributes ENABLE ROW LEVEL SECURITY;

-- Product attributes policies
CREATE POLICY "Enable read access for all users" ON product_attributes FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON product_attributes FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON product_attributes FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON product_attributes FOR DELETE USING (true);

-- ==========================================
-- PRODUCT ATTRIBUTE VALUES TABLE
-- ==========================================

CREATE TABLE product_attribute_values (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    attribute_id UUID NOT NULL REFERENCES product_attributes(id) ON DELETE CASCADE,
    value VARCHAR(255) NOT NULL, -- Normalized attribute value (e.g., 'red', 'large')
    display_value VARCHAR(255), -- User-friendly display (e.g., 'Red', 'Large')
    hex_color VARCHAR(7), -- For color attributes (e.g., '#FF0000')
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product attribute values indexes
CREATE INDEX idx_product_attribute_values_attribute ON product_attribute_values(attribute_id);
CREATE INDEX idx_product_attribute_values_value ON product_attribute_values(value);
CREATE INDEX idx_product_attribute_values_sort_order ON product_attribute_values(sort_order);
CREATE INDEX idx_product_attribute_values_active ON product_attribute_values(is_active) WHERE is_active = true;

-- Composite index for active values by attribute
CREATE INDEX idx_product_attribute_values_attribute_active 
ON product_attribute_values(attribute_id, sort_order) 
WHERE is_active = true;

-- Product attribute values RLS
ALTER TABLE product_attribute_values ENABLE ROW LEVEL SECURITY;

-- Product attribute values policies
CREATE POLICY "Enable read access for all users" ON product_attribute_values FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON product_attribute_values FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON product_attribute_values FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON product_attribute_values FOR DELETE USING (true);

-- ==========================================
-- PRODUCT VARIANTS TABLE
-- ==========================================

CREATE TABLE product_variants (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL UNIQUE, -- Stock keeping unit
    title VARCHAR(255), -- Variant title (optional)
    price NUMERIC NOT NULL CHECK (price >= 0), -- Variant price in CHF
    compare_at_price NUMERIC CHECK (compare_at_price >= 0), -- Original price for discounts
    stock_quantity INTEGER NOT NULL DEFAULT 100 CHECK (stock_quantity >= 0),
    track_inventory BOOLEAN NOT NULL DEFAULT true,
    continue_selling_when_out_of_stock BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    position INTEGER NOT NULL DEFAULT 0, -- Sort order
    source_platform VARCHAR NOT NULL DEFAULT 'swiss_vfg',
    source_variant_id VARCHAR, -- External platform variant ID
    source_data JSONB, -- Raw scraping data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product variants indexes
CREATE INDEX idx_product_variants_product ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_active ON product_variants(is_active) WHERE is_active = true;
CREATE INDEX idx_product_variants_position ON product_variants(position);

-- Default variant selection index (most important for performance)
CREATE INDEX idx_product_variants_product_position 
ON product_variants(product_id, position, created_at) 
WHERE is_active = true;

-- Product variants RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Product variants policies
CREATE POLICY "Enable read access for all users" ON product_variants FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON product_variants FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON product_variants FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON product_variants FOR DELETE USING (true);

-- ==========================================
-- VARIANT ATTRIBUTE VALUES TABLE (Junction)
-- ==========================================

CREATE TABLE variant_attribute_values (
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    attribute_value_id UUID NOT NULL REFERENCES product_attribute_values(id) ON DELETE CASCADE,
    PRIMARY KEY (variant_id, attribute_value_id)
);

-- Variant attribute values indexes
CREATE INDEX idx_variant_attribute_values_variant ON variant_attribute_values(variant_id);
CREATE INDEX idx_variant_attribute_values_attribute_value ON variant_attribute_values(attribute_value_id);

-- Variant attribute values RLS
ALTER TABLE variant_attribute_values ENABLE ROW LEVEL SECURITY;

-- Variant attribute values policies
CREATE POLICY "Enable read access for all users" ON variant_attribute_values FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON variant_attribute_values FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON variant_attribute_values FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON variant_attribute_values FOR DELETE USING (true);

-- ==========================================
-- ADD VARIANT SUPPORT TO CART ITEMS
-- ==========================================

-- Add variant_id column to cart_items table
ALTER TABLE cart_items 
ADD COLUMN variant_id UUID REFERENCES product_variants(id) ON DELETE SET NULL;

-- Add index for variant_id in cart_items
CREATE INDEX idx_cart_items_variant ON cart_items(variant_id) WHERE variant_id IS NOT NULL;

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Product variants updated_at trigger function
CREATE OR REPLACE FUNCTION update_product_variants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER product_variants_update_timestamp
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_product_variants_updated_at();

-- ==========================================
-- DATABASE VIEWS
-- ==========================================

-- 1. Product Variants with Attributes View
CREATE VIEW product_variants_detailed AS
SELECT 
    pv.id,
    pv.product_id,
    pv.sku,
    pv.title,
    pv.price,
    pv.compare_at_price,
    pv.stock_quantity,
    pv.track_inventory,
    pv.continue_selling_when_out_of_stock,
    pv.is_active,
    pv.position,
    pv.source_platform,
    pv.source_variant_id,
    pv.source_data,
    pv.created_at,
    pv.updated_at,
    
    -- Product information
    p.name as product_name,
    p.slug as product_slug,
    p.image_url as product_image_url,
    
    -- Aggregated attributes as JSON
    COALESCE(
        json_agg(
            json_build_object(
                'name', pa.name,
                'display_name', pa.display_name,
                'attribute_type', pa.attribute_type,
                'value', pav.value,
                'display_value', pav.display_value,
                'hex_color', pav.hex_color,
                'sort_order', pav.sort_order
            ) ORDER BY pa.sort_order, pav.sort_order
        ) FILTER (WHERE pa.id IS NOT NULL),
        '[]'::json
    ) as attributes,
    
    -- Attributes as text for search/filtering
    string_agg(
        CONCAT(pa.name, ':', pav.value), 
        ',' ORDER BY pa.sort_order, pav.sort_order
    ) as attributes_text,
    
    -- Count of attributes
    COUNT(pa.id) as attribute_count

FROM product_variants pv
JOIN products p ON p.id = pv.product_id
LEFT JOIN variant_attribute_values vav ON vav.variant_id = pv.id
LEFT JOIN product_attribute_values pav ON pav.id = vav.attribute_value_id
LEFT JOIN product_attributes pa ON pa.id = pav.attribute_id

GROUP BY 
    pv.id, pv.product_id, pv.sku, pv.title, pv.price, pv.compare_at_price,
    pv.stock_quantity, pv.track_inventory, pv.continue_selling_when_out_of_stock,
    pv.is_active, pv.position, pv.source_platform, pv.source_variant_id,
    pv.source_data, pv.created_at, pv.updated_at,
    p.name, p.slug, p.image_url;

-- 2. Products with Default Variants View
CREATE VIEW products_with_default_variants AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.image_url,
    p.brand_id,
    p.created_at,
    p.stock_code,
    
    -- Default variant information
    pv.id as default_variant_id,
    pv.sku as default_variant_sku,
    pv.price as variant_price,
    pv.compare_at_price as variant_compare_at_price,
    pv.stock_quantity as variant_stock,
    pv.track_inventory as variant_track_inventory,
    pv.continue_selling_when_out_of_stock as variant_continue_selling,
    
    -- NEW: Variant status and synthetic variant handling
    CASE WHEN pv.id IS NOT NULL THEN true ELSE false END as has_variants,
    COALESCE(pv.id::text, CONCAT(p.id::text, '-default')) as effective_variant_id,
    COALESCE(pv.sku, p.stock_code, CONCAT('PROD-', SUBSTRING(p.id::text, 1, 8))) as effective_sku,
    
    -- Backward compatibility fields with robust fallbacks
    COALESCE(pv.price, p.price) as price,
    COALESCE(pv.compare_at_price, p.discount_price) as discount_price,
    COALESCE(pv.stock_quantity, p.stock) as stock,
    
    -- Brand information (flattened)
    b.name as brand_name,
    b.slug as brand_slug,
    
    -- Category information (flattened)
    c.id as category_id,
    c.name as category_name,
    c.slug as category_slug,
    c.parent_id as category_parent_id,
    c.emoji as category_emoji,
    
    -- Calculated fields
    CASE 
        WHEN pv.compare_at_price IS NOT NULL AND pv.compare_at_price > pv.price 
        THEN pv.price 
        WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 
        THEN p.discount_price
        ELSE COALESCE(pv.price, p.price)
    END as effective_price,
    
    CASE 
        WHEN pv.compare_at_price IS NOT NULL AND pv.compare_at_price > pv.price 
        THEN true
        WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 
        THEN true
        ELSE false
    END as has_active_discount,
    
    CASE 
        WHEN pv.compare_at_price IS NOT NULL AND pv.compare_at_price > pv.price 
        THEN ROUND(((pv.compare_at_price - pv.price) / pv.compare_at_price * 100)::numeric, 2)
        WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 AND p.price > p.discount_price
        THEN ROUND(((p.price - p.discount_price) / p.price * 100)::numeric, 2)
        ELSE 0
    END as discount_percentage_actual,
    
    CASE 
        WHEN pv.compare_at_price IS NOT NULL AND pv.compare_at_price > pv.price 
        THEN (pv.compare_at_price - pv.price)
        WHEN p.discount_price IS NOT NULL AND p.discount_price > 0 AND p.price > p.discount_price
        THEN (p.price - p.discount_price)
        ELSE 0
    END as discount_amount

FROM products p
LEFT JOIN brands b ON b.id = p.brand_id
LEFT JOIN categories c ON c.id = p.category_id
LEFT JOIN LATERAL (
    SELECT *
    FROM product_variants pv_inner
    WHERE pv_inner.product_id = p.id 
      AND pv_inner.is_active = true
    ORDER BY pv_inner.position ASC, pv_inner.created_at ASC
    LIMIT 1
) pv ON true;

-- 3. Cart Items with Variants View
CREATE VIEW cart_items_with_variants AS
SELECT 
    -- Cart information
    c.id as cart_id,
    c.session_id,
    c.created_at as cart_created_at,
    c.updated_at as cart_updated_at,
    c.expires_at,
    
    -- Cart item information
    ci.id as item_id,
    ci.product_id,
    ci.quantity,
    ci.price as item_price,
    ci.created_at as item_created_at,
    ci.updated_at as item_updated_at,
    (ci.quantity * ci.price) as item_total,
    
    -- Product information
    p.name as product_name,
    p.slug as product_slug,
    p.image_url as product_image,
    p.stock as product_stock,
    
    -- Variant information (if exists)
    ci.variant_id,
    CASE 
        WHEN ci.variant_id IS NOT NULL THEN pvd.sku
        ELSE p.stock_code
    END as variant_sku,
    
    CASE 
        WHEN ci.variant_id IS NOT NULL THEN pvd.stock_quantity
        ELSE p.stock
    END as variant_stock,
    
    CASE 
        WHEN ci.variant_id IS NOT NULL THEN pvd.attributes
        ELSE '[]'::json
    END as variant_attributes,
    
    CASE 
        WHEN ci.variant_id IS NOT NULL THEN pvd.title
        ELSE NULL
    END as variant_title,
    
    -- Availability check
    CASE 
        WHEN ci.variant_id IS NOT NULL THEN 
            CASE 
                WHEN pvd.track_inventory = false THEN true
                WHEN pvd.continue_selling_when_out_of_stock = true THEN true
                WHEN pvd.stock_quantity >= ci.quantity THEN true
                ELSE false
            END
        ELSE 
            CASE 
                WHEN p.stock >= ci.quantity THEN true
                ELSE false
            END
    END as is_available

FROM carts c
LEFT JOIN cart_items ci ON ci.cart_id = c.id
LEFT JOIN products p ON p.id = ci.product_id
LEFT JOIN product_variants_detailed pvd ON pvd.id = ci.variant_id;

-- 4. Product Attributes Summary View (for variant selection UI)
CREATE VIEW product_attributes_summary AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    json_agg(
        json_build_object(
            'name', pa.name,
            'display_name', pa.display_name,
            'attribute_type', pa.attribute_type,
            'is_required', pa.is_required,
            'values', pa_values.values
        ) ORDER BY pa.sort_order
    ) as attributes
FROM products p
JOIN product_variants pv ON pv.product_id = p.id AND pv.is_active = true
JOIN variant_attribute_values vav ON vav.variant_id = pv.id
JOIN product_attribute_values pav ON pav.id = vav.attribute_value_id
JOIN product_attributes pa ON pa.id = pav.attribute_id
JOIN LATERAL (
    SELECT json_agg(
        json_build_object(
            'value', pav_inner.value,
            'display_value', pav_inner.display_value,
            'hex_color', pav_inner.hex_color,
            'sort_order', pav_inner.sort_order
        ) ORDER BY pav_inner.sort_order
    ) as values
    FROM product_attribute_values pav_inner
    WHERE pav_inner.attribute_id = pa.id
      AND pav_inner.is_active = true
      AND EXISTS (
          SELECT 1 FROM variant_attribute_values vav_inner 
          JOIN product_variants pv_inner ON pv_inner.id = vav_inner.variant_id
          WHERE vav_inner.attribute_value_id = pav_inner.id 
            AND pv_inner.product_id = p.id 
            AND pv_inner.is_active = true
      )
) pa_values ON true
GROUP BY p.id, p.name;

-- ==========================================
-- SAMPLE DATA
-- ==========================================

-- Sample attributes
INSERT INTO product_attributes (name, display_name, attribute_type, sort_order) VALUES
('color', 'Color', 'select', 1),
('size', 'Size', 'select', 2),
('material', 'Material', 'select', 3),
('capacity', 'Capacity', 'text', 4);

-- Sample attribute values
INSERT INTO product_attribute_values (attribute_id, value, display_value, hex_color, sort_order) VALUES
-- Colors
((SELECT id FROM product_attributes WHERE name = 'color'), 'red', 'Red', '#FF0000', 1),
((SELECT id FROM product_attributes WHERE name = 'color'), 'blue', 'Blue', '#0000FF', 2),
((SELECT id FROM product_attributes WHERE name = 'color'), 'green', 'Green', '#00FF00', 3),
((SELECT id FROM product_attributes WHERE name = 'color'), 'black', 'Black', '#000000', 4),
((SELECT id FROM product_attributes WHERE name = 'color'), 'white', 'White', '#FFFFFF', 5),

-- Sizes
((SELECT id FROM product_attributes WHERE name = 'size'), 'xs', 'Extra Small', NULL, 1),
((SELECT id FROM product_attributes WHERE name = 'size'), 's', 'Small', NULL, 2),
((SELECT id FROM product_attributes WHERE name = 'size'), 'm', 'Medium', NULL, 3),
((SELECT id FROM product_attributes WHERE name = 'size'), 'l', 'Large', NULL, 4),
((SELECT id FROM product_attributes WHERE name = 'size'), 'xl', 'Extra Large', NULL, 5),

-- Materials
((SELECT id FROM product_attributes WHERE name = 'material'), 'cotton', 'Cotton', NULL, 1),
((SELECT id FROM product_attributes WHERE name = 'material'), 'polyester', 'Polyester', NULL, 2),
((SELECT id FROM product_attributes WHERE name = 'material'), 'wool', 'Wool', NULL, 3),
((SELECT id FROM product_attributes WHERE name = 'material'), 'leather', 'Leather', NULL, 4);

-- ==========================================
-- COMMENTS AND DOCUMENTATION
-- ==========================================

COMMENT ON TABLE product_attributes IS 'Defines the types of attributes that products can have (color, size, etc.)';
COMMENT ON TABLE product_attribute_values IS 'Stores the possible values for each attribute (red, large, etc.)';
COMMENT ON TABLE product_variants IS 'Product variants with specific attribute combinations and pricing';
COMMENT ON TABLE variant_attribute_values IS 'Junction table linking variants to their attribute values';

COMMENT ON VIEW products_with_default_variants IS 'Products with their default variant pricing and stock information';
COMMENT ON VIEW product_variants_detailed IS 'Complete variant information including all attributes as JSON';
COMMENT ON VIEW cart_items_with_variants IS 'Cart items with variant information and availability checks';
COMMENT ON VIEW product_attributes_summary IS 'Product attributes and values for variant selection UI';