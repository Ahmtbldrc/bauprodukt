# E-Ticaret Veritabanı Şeması

## 1. Brands (Markalar)

- **id**: uuid (Primary Key, default: gen_random_uuid())
- **name**: varchar (NOT NULL)
- **slug**: varchar (NOT NULL, UNIQUE)
- **created_at**: timestamp with time zone (default: now())

## 2. Categories (Kategoriler)

- **id**: uuid (Primary Key, default: gen_random_uuid())
- **name**: varchar (NOT NULL)
- **slug**: varchar (NOT NULL, UNIQUE)
- **parent_id**: uuid (NULL olabilir, kendi tablosuna self-referencing foreign key)
- **created_at**: timestamp with time zone (default: now())
- **emoji**: varchar (NULL olabilir)

## 3. Products (Ürünler)

- **id**: uuid (Primary Key, default: gen_random_uuid())
- **name**: varchar (NOT NULL)
- **slug**: varchar (NOT NULL, UNIQUE)
- **description**: text (NULL olabilir)
- **price**: numeric (NOT NULL, >= 0)
- **stock**: integer (NOT NULL, default: 0, >= 0)
- **image_url**: text (NULL olabilir)
- **brand_id**: uuid (NULL olabilir, brands tablosuna foreign key)
- **category_id**: uuid (NULL olabilir, categories tablosuna foreign key)
- **created_at**: timestamp with time zone (default: now())
- **discount_price**: numeric (NULL olabilir, >= 0)
- **stock_code**: varchar (NULL olabilir, UNIQUE)

## 4. Product_Images (Ürün Görselleri)

- **id**: uuid (Primary Key, default: gen_random_uuid())
- **product_id**: uuid (NOT NULL, products tablosuna foreign key)
- **image_url**: text (NOT NULL)
- **source_url**: text (NULL olabilir, orijinal Swiss VFG URL'i)
- **content_hash**: varchar(64) (NULL olabilir, SHA256 hash duplicate detection için)
- **file_size**: bigint (NULL olabilir, dosya boyutu byte cinsinden)
- **created_at**: timestamp with time zone (default: now())
- **order_index**: integer (default: 0)
- **is_cover**: boolean (default: false)

## 5. Banners (Bannerlar)

- **id**: uuid (Primary Key, default: gen_random_uuid())
- **title**: varchar (NULL olabilir)
- **image_url**: text (NOT NULL)
- **link**: text (NULL olabilir)
- **order_index**: integer (NOT NULL, default: 0, >= 0)
- **is_active**: boolean (NOT NULL, default: true)
- **created_at**: timestamp with time zone (default: now())

## 6. Carts (Sepetler)

- **id**: uuid (Primary Key, default: gen_random_uuid())
- **session_id**: varchar (NOT NULL, UNIQUE)
- **created_at**: timestamp with time zone (default: now())
- **updated_at**: timestamp with time zone (default: now())
- **expires_at**: timestamp with time zone (default: now() + '7 days'::interval)

## 7. Cart_Items (Sepet Öğeleri)

- **id**: uuid (Primary Key, default: gen_random_uuid())
- **cart_id**: uuid (NOT NULL, carts tablosuna foreign key)
- **product_id**: uuid (NOT NULL, products tablosuna foreign key)
- **quantity**: integer (NOT NULL, > 0)
- **price**: numeric (NOT NULL, >= 0)
- **created_at**: timestamp with time zone (default: now())
- **updated_at**: timestamp with time zone (default: now())

## 8. Orders (Siparişler)

- **id**: uuid (Primary Key, default: gen_random_uuid())
- **order_number**: varchar (NOT NULL, UNIQUE)
- **customer_name**: varchar (NOT NULL)
- **customer_email**: varchar (NOT NULL)
- **customer_phone**: varchar (NOT NULL)
- **shipping_province**: varchar (NOT NULL)
- **shipping_district**: varchar (NOT NULL)
- **shipping_postal_code**: varchar (NOT NULL)
- **shipping_address**: text (NOT NULL)
- **billing_province**: varchar (NULL olabilir)
- **billing_district**: varchar (NULL olabilir)
- **billing_postal_code**: varchar (NULL olabilir)
- **billing_address**: text (NULL olabilir)
- **status**: order_status enum (default: 'pending', değerler: pending, confirmed, processing, shipped, delivered, cancelled)
- **total_amount**: numeric (NOT NULL, >= 0)
- **notes**: text (NULL olabilir)
- **created_at**: timestamp with time zone (default: now())
- **updated_at**: timestamp with time zone (default: now())

## 9. Order_Items (Sipariş Öğeleri)

- **id**: uuid (Primary Key, default: gen_random_uuid())
- **order_id**: uuid (NOT NULL, orders tablosuna foreign key)
- **product_id**: uuid (NOT NULL, products tablosuna foreign key)
- **product_name**: varchar (NOT NULL)
- **product_slug**: varchar (NOT NULL)
- **quantity**: integer (NOT NULL, > 0)
- **unit_price**: numeric (NOT NULL, >= 0)
- **total_price**: numeric (NOT NULL, >= 0)
- **created_at**: timestamp with time zone (default: now())

## 10. Product_Attributes (Ürün Özellik Tipleri)

- **id**: uuid (Primary Key, default: gen_random_uuid())
- **name**: varchar(100) (NOT NULL, normalized attribute name)
- **display_name**: varchar(100) (NOT NULL, user-friendly display name)
- **attribute_type**: varchar (NOT NULL, default: 'select', values: select, text, number)
- **is_required**: boolean (NOT NULL, default: false)
- **sort_order**: integer (NOT NULL, default: 0)
- **created_at**: timestamp with time zone (default: now())

## 11. Product_Attribute_Values (Ürün Özellik Değerleri)

- **id**: uuid (Primary Key, default: gen_random_uuid())
- **attribute_id**: uuid (NOT NULL, product_attributes tablosuna foreign key)
- **value**: varchar(255) (NOT NULL, normalized attribute value)
- **display_value**: varchar(255) (NULL olabilir, user-friendly display)
- **hex_color**: varchar (NULL olabilir, color attributes için hex color code)
- **sort_order**: integer (NOT NULL, default: 0)
- **is_active**: boolean (NOT NULL, default: true)
- **created_at**: timestamp with time zone (default: now())

## 12. Product_Variants (Ürün Varyantları)

- **id**: uuid (Primary Key, default: gen_random_uuid())
- **product_id**: uuid (NOT NULL, products tablosuna foreign key)
- **sku**: varchar(100) (NOT NULL, UNIQUE, stock keeping unit)
- **title**: varchar(255) (NULL olabilir, variant title)
- **price**: numeric (NOT NULL, >= 0, variant price in CHF)
- **compare_at_price**: numeric (NULL olabilir, >= 0, original price for discounts)
- **stock_quantity**: integer (NOT NULL, default: 100, >= 0)
- **track_inventory**: boolean (NOT NULL, default: true)
- **continue_selling_when_out_of_stock**: boolean (NOT NULL, default: false)
- **is_active**: boolean (NOT NULL, default: true)
- **position**: integer (NOT NULL, default: 0, sort order)
- **source_platform**: varchar (NOT NULL, default: 'swiss_vfg')
- **source_variant_id**: varchar (NULL olabilir, external platform variant ID)
- **source_data**: jsonb (NULL olabilir, raw scraping data)
- **created_at**: timestamp with time zone (default: now())
- **updated_at**: timestamp with time zone (default: now())

## 13. Variant_Attribute_Values (Varyant-Özellik İlişkileri)

- **variant_id**: uuid (NOT NULL, product_variants tablosuna foreign key)
- **attribute_value_id**: uuid (NOT NULL, product_attribute_values tablosuna foreign key)
- **PRIMARY KEY**: (variant_id, attribute_value_id)

## İlişkiler

### Temel Ürün İlişkileri

- Products -> Brands (brand_id)
- Products -> Categories (category_id)
- Product_Images -> Products (product_id)

### Varyant Sistemi İlişkileri

- Product_Variants -> Products (product_id)
- Product_Attribute_Values -> Product_Attributes (attribute_id)
- Variant_Attribute_Values -> Product_Variants (variant_id)
- Variant_Attribute_Values -> Product_Attribute_Values (attribute_value_id)

### Sepet ve Sipariş İlişkileri

- Cart_Items -> Carts (cart_id)
- Cart_Items -> Products (product_id)
- Order_Items -> Orders (order_id)
- Order_Items -> Products (product_id)

### Hiyerarşik İlişkiler

- Categories -> Categories (parent_id) - Hiyerarşik kategori yapısı

## Güvenlik

Tüm tablolarda Row Level Security (RLS) etkinleştirilmiş durumda.
