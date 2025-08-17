-- ==========================================
-- ADD TRACKING FIELDS MIGRATION
-- ==========================================
-- Adds tracking fields to orders table for cargo tracking functionality

-- ==========================================
-- ALTER ORDERS TABLE
-- ==========================================

-- Add tracking-related fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS tracking_url TEXT;

-- Add index for tracking URL field
CREATE INDEX IF NOT EXISTS idx_orders_tracking_url ON orders(tracking_url);

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON COLUMN orders.tracking_url IS 'Direct tracking URL for cargo company website';

-- ==========================================
-- VERIFICATION
-- ==========================================

-- Verify the new column exists
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name = 'tracking_url';
