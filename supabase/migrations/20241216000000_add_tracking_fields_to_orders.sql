-- ==========================================
-- ADD TRACKING FIELDS TO ORDERS TABLE
-- ==========================================
-- Add tracking_number and expected_delivery_date columns to orders table

-- Add tracking_number column
ALTER TABLE orders 
ADD COLUMN tracking_number VARCHAR(100);

-- Add expected_delivery_date column  
ALTER TABLE orders 
ADD COLUMN expected_delivery_date DATE;

-- Create index for tracking_number for faster lookups
CREATE INDEX idx_orders_tracking_number ON orders(tracking_number);

-- Create index for expected_delivery_date for date-based queries
CREATE INDEX idx_orders_expected_delivery_date ON orders(expected_delivery_date);

-- Update the order_summary view to include new fields
DROP VIEW IF EXISTS order_summary;

CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_email,
    o.customer_phone,
    o.status,
    o.total_amount,
    o.tracking_number,
    o.expected_delivery_date,
    o.created_at,
    o.updated_at,
    COUNT(oi.id) as item_count,
    STRING_AGG(oi.product_name, ', ') as products_summary
FROM orders o
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, o.order_number, o.customer_name, o.customer_email, 
         o.customer_phone, o.status, o.total_amount, o.tracking_number, 
         o.expected_delivery_date, o.created_at, o.updated_at;

-- Update the order_details view to include new fields
DROP VIEW IF EXISTS order_details;

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