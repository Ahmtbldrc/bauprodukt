-- Migration: Add status and is_changeable columns to existing products table
-- Description: Adds columns required for waitlist workflow to existing products table
-- Date: 2024
-- Note: This migration assumes the products table already exists

-- 1. Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN status VARCHAR(20) DEFAULT 'active' 
        CHECK (status IN ('active', 'passive', 'waiting_approval', 'rejected', 'pending_update'));
        
        -- Create index for status column
        CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
        
        RAISE NOTICE 'Added status column to products table';
    ELSE
        RAISE NOTICE 'status column already exists in products table';
    END IF;
END $$;

-- 2. Add is_changeable column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'is_changeable'
    ) THEN
        ALTER TABLE products 
        ADD COLUMN is_changeable BOOLEAN DEFAULT true;
        
        -- Create index for is_changeable column
        CREATE INDEX IF NOT EXISTS idx_products_changeable ON products(is_changeable);
        
        RAISE NOTICE 'Added is_changeable column to products table';
    ELSE
        RAISE NOTICE 'is_changeable column already exists in products table';
    END IF;
END $$;

-- 3. Update existing products to have proper status
-- All existing products should be 'active' since they were live before this migration
UPDATE products 
SET status = 'active' 
WHERE status IS NULL;

-- 4. Update existing products to be changeable by default
-- This can be changed later on a per-product basis
UPDATE products 
SET is_changeable = true 
WHERE is_changeable IS NULL;

-- 5. Add comments to document the columns
COMMENT ON COLUMN products.status IS 'Product lifecycle status: active (live), passive (manually offline), waiting_approval (new pending), rejected (new rejected), pending_update (has pending changes)';
COMMENT ON COLUMN products.is_changeable IS 'Whether this product can be updated by the scraper. Non-changeable products are skipped entirely.';

-- 6. Verify the migration
DO $$ 
DECLARE
    status_exists BOOLEAN;
    changeable_exists BOOLEAN;
    products_count INTEGER;
    active_count INTEGER;
BEGIN
    -- Check if columns exist
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'status'
    ) INTO status_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' AND column_name = 'is_changeable'
    ) INTO changeable_exists;
    
    -- Get counts
    SELECT COUNT(*) INTO products_count FROM products;
    SELECT COUNT(*) INTO active_count FROM products WHERE status = 'active';
    
    -- Report results
    RAISE NOTICE '=== Migration Verification ===';
    RAISE NOTICE 'status column exists: %', status_exists;
    RAISE NOTICE 'is_changeable column exists: %', changeable_exists;
    RAISE NOTICE 'Total products: %', products_count;
    RAISE NOTICE 'Active products: %', active_count;
    
    IF status_exists AND changeable_exists THEN
        RAISE NOTICE '✅ Migration completed successfully!';
    ELSE
        RAISE EXCEPTION '❌ Migration failed - missing columns';
    END IF;
END $$;

-- 7. Grant permissions (adjust based on your Supabase roles)
-- Note: These may need to be adjusted based on your specific role setup
GRANT SELECT, UPDATE ON products TO authenticated;
GRANT SELECT ON products TO anon;