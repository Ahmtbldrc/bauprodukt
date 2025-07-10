-- ==========================================
-- CART AND ORDER TABLES MIGRATION
-- ==========================================
-- Sipariş ve sepet yönetimi için gerekli tablolar

-- ==========================================
-- ENUMS
-- ==========================================

-- Sipariş durumları için enum
CREATE TYPE order_status AS ENUM (
    'pending',
    'confirmed', 
    'processing',
    'shipped',
    'delivered',
    'cancelled'
);

-- ==========================================
-- CARTS TABLE
-- ==========================================

CREATE TABLE carts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days')
);

-- Carts tablosu için indexler
CREATE INDEX idx_carts_session_id ON carts(session_id);
CREATE INDEX idx_carts_expires_at ON carts(expires_at);
CREATE INDEX idx_carts_created_at ON carts(created_at);

-- TTL için otomatik temizleme function'ı
CREATE OR REPLACE FUNCTION delete_expired_carts()
RETURNS void AS $$
BEGIN
    DELETE FROM carts WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Carts tablosu için RLS
ALTER TABLE carts ENABLE ROW LEVEL SECURITY;

-- Carts için public access policy'leri
CREATE POLICY "Enable read access for all users" ON carts FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON carts FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON carts FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON carts FOR DELETE USING (true);

-- ==========================================
-- CART_ITEMS TABLE
-- ==========================================

CREATE TABLE cart_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Aynı sepette aynı ürün sadece bir kez olabilir
    UNIQUE(cart_id, product_id)
);

-- Cart_items tablosu için indexler
CREATE INDEX idx_cart_items_cart_id ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product_id ON cart_items(product_id);
CREATE INDEX idx_cart_items_created_at ON cart_items(created_at);

-- Cart_items tablosu için RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Cart_items için public access policy'leri
CREATE POLICY "Enable read access for all users" ON cart_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON cart_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON cart_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON cart_items FOR DELETE USING (true);

-- ==========================================
-- ORDERS TABLE
-- ==========================================

CREATE TABLE orders (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Müşteri bilgileri
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50) NOT NULL,
    
    -- Teslimat adresi bilgileri
    shipping_province VARCHAR(255) NOT NULL,
    shipping_district VARCHAR(255) NOT NULL,
    shipping_postal_code VARCHAR(20) NOT NULL,
    shipping_address TEXT NOT NULL,
    
    -- Fatura adresi (opsiyonel)
    billing_province VARCHAR(255),
    billing_district VARCHAR(255),
    billing_postal_code VARCHAR(20),
    billing_address TEXT,
    
    -- Sipariş detayları
    status order_status NOT NULL DEFAULT 'pending',
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders tablosu için indexler
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_customer_email ON orders(customer_email);
CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_total_amount ON orders(total_amount);

-- Admin queries için composite indexler
CREATE INDEX idx_orders_status_created_at ON orders(status, created_at);
CREATE INDEX idx_orders_customer_created_at ON orders(customer_email, created_at);

-- Orders tablosu için RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Orders için public access policy'leri
CREATE POLICY "Enable read access for all users" ON orders FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON orders FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON orders FOR DELETE USING (true);

-- ==========================================
-- ORDER_ITEMS TABLE
-- ==========================================

CREATE TABLE order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    
    -- Snapshot bilgileri (ürün değişse de sipariş korunur)
    product_name VARCHAR(255) NOT NULL,
    product_slug VARCHAR(255) NOT NULL,
    
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Order_items tablosu için indexler
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_product_id ON order_items(product_id);
CREATE INDEX idx_order_items_created_at ON order_items(created_at);

-- Order_items tablosu için RLS
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Order_items için public access policy'leri
CREATE POLICY "Enable read access for all users" ON order_items FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON order_items FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON order_items FOR DELETE USING (true);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Sipariş numarası generate eden function
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    order_num VARCHAR(50);
    counter INTEGER := 0;
BEGIN
    LOOP
        -- BP + 6 haneli random sayı
        order_num := 'BP' || LPAD(FLOOR(RANDOM() * 999999 + 1)::TEXT, 6, '0');
        
        -- Unique check
        IF NOT EXISTS (SELECT 1 FROM orders WHERE order_number = order_num) THEN
            RETURN order_num;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            RAISE EXCEPTION 'Cannot generate unique order number after 100 attempts';
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Cart'ı update ettiğinde updated_at'i güncelleyen trigger function
CREATE OR REPLACE FUNCTION update_cart_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE carts SET updated_at = NOW() WHERE id = NEW.cart_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cart items değiştiğinde cart updated_at'ini güncelle
CREATE TRIGGER cart_items_update_cart_timestamp
    AFTER INSERT OR UPDATE OR DELETE ON cart_items
    FOR EACH ROW
    EXECUTE FUNCTION update_cart_updated_at();

-- Order updated_at trigger function
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER orders_update_timestamp
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- ==========================================
-- USEFUL VIEWS
-- ==========================================

-- Sepet detayları view
CREATE VIEW cart_details AS
SELECT 
    c.id as cart_id,
    c.session_id,
    c.created_at as cart_created_at,
    c.updated_at as cart_updated_at,
    c.expires_at,
    ci.id as item_id,
    ci.product_id,
    ci.quantity,
    ci.price as item_price,
    (ci.quantity * ci.price) as item_total,
    p.name as product_name,
    p.slug as product_slug,
    p.image_url as product_image,
    p.stock as product_stock
FROM carts c
LEFT JOIN cart_items ci ON c.id = ci.cart_id
LEFT JOIN products p ON ci.product_id = p.id;

-- Sipariş detayları view
CREATE VIEW order_details AS
SELECT 
    o.*,
    oi.id as item_id,
    oi.product_id,
    oi.product_name,
    oi.product_slug,
    oi.quantity,
    oi.unit_price,
    oi.total_price as item_total
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id;

-- Sipariş özeti view (admin için)
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.status,
    o.total_amount,
    o.created_at,
    o.updated_at,
    COUNT(oi.id) as item_count,
    STRING_AGG(oi.product_name, ', ') as products_summary
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.customer_name, o.customer_email, 
         o.customer_phone, o.status, o.total_amount, o.created_at, o.updated_at; 