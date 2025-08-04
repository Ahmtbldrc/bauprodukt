# Database Views for Variant System

Product variant system için gerekli database view'ları ve implementasyon rehberi.

## Overview

Variant sistemi için 3 ana view oluşturulması gerekiyor:
1. **`products_with_default_variants`** - Product listing için default variant bilgileri
2. **`product_variants_detailed`** - Complete variant information with attributes  
3. **`cart_items_with_variants`** - Cart items with variant data

## 1. Products with Default Variants View

Mevcut `products_with_relations` view'ının variant-aware versiyonu. Her product için default variant'ın fiyat ve stok bilgilerini dahil eder.

### SQL Query

```sql
CREATE OR REPLACE VIEW products_with_default_variants AS
SELECT 
    p.id,
    p.name,
    p.slug,
    p.description,
    p.image_url,
    p.brand_id,
    p.category_id,
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
    
    -- Backward compatibility fields
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
```

### Usage Example

```sql
-- Get products with default variant pricing
SELECT * FROM products_with_default_variants 
WHERE category_id = 'category-uuid'
ORDER BY created_at DESC;

-- Search with variant pricing
SELECT * FROM products_with_default_variants 
WHERE name ILIKE '%jacket%' 
  AND variant_price BETWEEN 100 AND 500;
```

## 2. Product Variants with Attributes View

Complete variant information including all attributes. API'de variant detaylarını göstermek için kullanılır.

### SQL Query

```sql
CREATE OR REPLACE VIEW product_variants_detailed AS
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
```

### Usage Example

```sql
-- Get all variants for a product
SELECT * FROM product_variants_detailed 
WHERE product_id = 'product-uuid'
ORDER BY position ASC;

-- Find variants by attribute
SELECT * FROM product_variants_detailed 
WHERE attributes_text LIKE '%color:red%'
  AND is_active = true;

-- Get variant with specific attributes
SELECT * FROM product_variants_detailed 
WHERE product_id = 'product-uuid'
  AND attributes_text LIKE '%color:red%'
  AND attributes_text LIKE '%size:large%'
  AND is_active = true
LIMIT 1;
```

## 3. Cart Items with Variants View

Mevcut `cart_details` view'ının variant-aware versiyonu. Cart item'larında variant bilgilerini gösterir.

### SQL Query

```sql
CREATE OR REPLACE VIEW cart_items_with_variants AS
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
```

### Usage Example

```sql
-- Get cart with all items and variants
SELECT * FROM cart_items_with_variants 
WHERE session_id = 'session-uuid'
  AND item_id IS NOT NULL
ORDER BY item_created_at DESC;

-- Check cart availability
SELECT 
    item_id,
    product_name,
    variant_title,
    quantity,
    is_available,
    CASE 
        WHEN variant_id IS NOT NULL THEN variant_stock
        ELSE product_stock
    END as available_stock
FROM cart_items_with_variants 
WHERE session_id = 'session-uuid'
  AND item_id IS NOT NULL;

-- Calculate cart totals
SELECT 
    session_id,
    COUNT(item_id) as total_items,
    SUM(quantity) as total_quantity,
    SUM(item_total) as total_amount,
    COUNT(CASE WHEN is_available = false THEN 1 END) as unavailable_items
FROM cart_items_with_variants 
WHERE session_id = 'session-uuid'
GROUP BY session_id;
```

## 4. Helper Views

### Product Attributes Summary

Variant seçim UI'ı için kullanılacak attribute bilgileri.

```sql
CREATE OR REPLACE VIEW product_attributes_summary AS
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
```

## Performance Considerations

### Indexes

View'ların performansı için gerekli index'ler:

```sql
-- Product variants indexes
CREATE INDEX idx_product_variants_product_position 
ON product_variants(product_id, position, created_at) 
WHERE is_active = true;

CREATE INDEX idx_product_variants_active 
ON product_variants(is_active, position);

-- Variant attribute values indexes  
CREATE INDEX idx_variant_attribute_values_variant 
ON variant_attribute_values(variant_id);

CREATE INDEX idx_variant_attribute_values_attribute 
ON variant_attribute_values(attribute_value_id);

-- Cart items variant index
CREATE INDEX idx_cart_items_variant 
ON cart_items(variant_id) 
WHERE variant_id IS NOT NULL;

-- Product attribute values indexes
CREATE INDEX idx_product_attribute_values_attribute 
ON product_attribute_values(attribute_id, sort_order) 
WHERE is_active = true;
```

### Query Optimization Notes

1. **LATERAL Join** kullanımı default variant seçimi için optimize edilmiştir
2. **JSON aggregation** variant attribute'ları için cache-friendly'dir
3. **Calculated fields** client-side hesaplama ihtiyacını ortadan kaldırır
4. **Filtered aggregation** null values'ları temizler

## Migration Order

View'ları oluştururken sıra önemli:

1. **product_variants_detailed** (temel variant view)
2. **products_with_default_variants** (product listing)
3. **cart_items_with_variants** (cart operations)
4. **product_attributes_summary** (helper view)

## Testing

Her view için test sorguları:

```sql
-- Test 1: Default variant selection
SELECT product_id, default_variant_id, variant_price 
FROM products_with_default_variants 
LIMIT 5;

-- Test 2: Variant attributes
SELECT id, product_name, attributes 
FROM product_variants_detailed 
WHERE attribute_count > 0 
LIMIT 3;

-- Test 3: Cart with variants
SELECT session_id, product_name, variant_title, quantity, is_available
FROM cart_items_with_variants 
WHERE item_id IS NOT NULL 
LIMIT 5;
```

## Rollback

View'ları kaldırmak için:

```sql
DROP VIEW IF EXISTS cart_items_with_variants;
DROP VIEW IF EXISTS product_attributes_summary;
DROP VIEW IF EXISTS product_variants_detailed;
DROP VIEW IF EXISTS products_with_default_variants;
```

---

**⚠️ Important Notes:**

1. View'ları production'da oluşturmadan önce staging'de test edin
2. Mevcut `products_with_relations` view'ı ile backward compatibility'yi kontrol edin
3. Performance impact'ini büyük dataset'lerde test edin
4. Cart_items tablosuna `variant_id` column'ını eklemeyi unutmayın

**🚀 Implementation Ready!** Bu view'lar oluşturulduktan sonra API implementation'a geçebiliriz.