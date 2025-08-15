-- Migration: Add waitlist workflow support for Swiss VFG scraper
-- Description: Adds product status column and waitlist_updates table per PRD requirements

-- 1. Add status column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active' 
CHECK (status IN ('active', 'passive', 'waiting_approval', 'rejected', 'pending_update'));

-- 2. Add is_changeable column to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_changeable BOOLEAN DEFAULT true;

-- 3. Create waitlist_updates table for pending changes
CREATE TABLE IF NOT EXISTS waitlist_updates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_slug VARCHAR(255) NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,  -- NULL for new products
    
    -- Change payload
    payload_json JSONB NOT NULL,  -- Complete product data or changes
    diff_summary JSONB,  -- Human-readable diff for admin review
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(100) DEFAULT 'system',
    version INTEGER DEFAULT 1,
    reason VARCHAR(50) NOT NULL,
    
    -- Validation flags
    is_valid BOOLEAN DEFAULT true,
    validation_errors JSONB,
    requires_manual_review BOOLEAN DEFAULT false,
    
    -- Price validation
    price_drop_percentage NUMERIC(5,2),
    has_invalid_discount BOOLEAN DEFAULT false,
    
    -- Indexes
    CONSTRAINT waitlist_updates_reason_check 
        CHECK (reason IN ('new_product', 'price_change', 'variant_change', 
                         'name_change', 'image_change', 'sku_change', 'multiple_changes'))
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_product_slug ON waitlist_updates(product_slug);
CREATE INDEX IF NOT EXISTS idx_waitlist_product_id ON waitlist_updates(product_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist_updates(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_waitlist_reason ON waitlist_updates(reason);
CREATE INDEX IF NOT EXISTS idx_waitlist_valid ON waitlist_updates(is_valid);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_changeable ON products(is_changeable);

-- 5. Create audit_log table for tracking admin decisions
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    actor VARCHAR(255) NOT NULL,
    action VARCHAR(50) NOT NULL,
    target_type VARCHAR(50) NOT NULL,  -- 'product' or 'waitlist_update'
    target_id UUID NOT NULL,
    
    -- Change details
    before_state JSONB,
    after_state JSONB,
    
    -- Metadata
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reason TEXT,
    
    -- Indexes
    CONSTRAINT audit_log_action_check 
        CHECK (action IN ('approve_new', 'reject_new', 'approve_update', 
                         'reject_update', 'bulk_approve', 'bulk_reject', 
                         'status_change', 'manual_edit'))
);

-- 6. Create indexes for audit_log
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp DESC);

-- 7. Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_waitlist_updated_at BEFORE UPDATE
    ON waitlist_updates FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. Set default brand to VFG for all new products (as per PRD)
-- Note: The application will always set brand_id to VFG UUID
-- This is just a comment reminder - actual UUID must be obtained from brands table

-- 9. Update existing products to have status (if table already has data)
UPDATE products 
SET status = 'active' 
WHERE status IS NULL;

-- 10. Grant permissions (adjust based on your Supabase roles)
GRANT ALL ON waitlist_updates TO authenticated;
GRANT ALL ON audit_log TO authenticated;
GRANT SELECT ON waitlist_updates TO anon;
GRANT SELECT ON audit_log TO anon;