-- ==========================================
-- PAYMENT SYSTEM MIGRATION
-- ==========================================
-- Adds payment provider integration fields and tracking tables
-- for Stripe, DataTrans, and Infoniqa ONE 200 integration

-- ==========================================
-- ENUMS
-- ==========================================

-- Payment status enum
CREATE TYPE payment_status AS ENUM (
    'pending',
    'processing',
    'paid',
    'failed',
    'cancelled',
    'expired'
);

-- Payment provider enum
CREATE TYPE payment_provider AS ENUM (
    'stripe',
    'datatrans'
);

-- Infoniqa sync status enum
CREATE TYPE infoniqa_sync_status AS ENUM (
    'pending',
    'success',
    'failed'
);

-- ==========================================
-- ALTER ORDERS TABLE
-- ==========================================

-- Add payment-related fields to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS payment_provider payment_provider,
ADD COLUMN IF NOT EXISTS payment_status payment_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'CHF',
ADD COLUMN IF NOT EXISTS provider_session_id TEXT,
ADD COLUMN IF NOT EXISTS provider_payment_id TEXT,
ADD COLUMN IF NOT EXISTS infoniqa_sync_status infoniqa_sync_status,
ADD COLUMN IF NOT EXISTS infoniqa_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS requires_manual_reconciliation BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS infoniqa_last_error TEXT,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

-- Add indexes for payment fields
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider ON orders(payment_provider);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_provider_session_id ON orders(provider_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_provider_payment_id ON orders(provider_payment_id);
CREATE INDEX IF NOT EXISTS idx_orders_infoniqa_sync_status ON orders(infoniqa_sync_status);
CREATE INDEX IF NOT EXISTS idx_orders_requires_manual_reconciliation ON orders(requires_manual_reconciliation);
CREATE INDEX IF NOT EXISTS idx_orders_paid_at ON orders(paid_at);

-- Composite indexes for common queries
CREATE INDEX IF NOT EXISTS idx_orders_payment_provider_status ON orders(payment_provider, payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status_paid_at ON orders(payment_status, paid_at);

-- ==========================================
-- PAYMENT_EVENTS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS payment_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider payment_provider NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    status_before payment_status,
    status_after payment_status,
    code VARCHAR(100),
    message TEXT,
    raw_payload JSONB,
    correlation_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payment_events
CREATE INDEX IF NOT EXISTS idx_payment_events_order_id ON payment_events(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_provider ON payment_events(provider);
CREATE INDEX IF NOT EXISTS idx_payment_events_event_type ON payment_events(event_type);
CREATE INDEX IF NOT EXISTS idx_payment_events_correlation_id ON payment_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_payment_events_created_at ON payment_events(created_at);

-- ==========================================
-- PAYMENT_ERRORS TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS payment_errors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    provider payment_provider,
    error_type VARCHAR(100) NOT NULL,
    error_code VARCHAR(100),
    error_message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'error', -- 'warning', 'error', 'critical'
    context JSONB,
    correlation_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for payment_errors
CREATE INDEX IF NOT EXISTS idx_payment_errors_order_id ON payment_errors(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_errors_provider ON payment_errors(provider);
CREATE INDEX IF NOT EXISTS idx_payment_errors_error_type ON payment_errors(error_type);
CREATE INDEX IF NOT EXISTS idx_payment_errors_severity ON payment_errors(severity);
CREATE INDEX IF NOT EXISTS idx_payment_errors_correlation_id ON payment_errors(correlation_id);
CREATE INDEX IF NOT EXISTS idx_payment_errors_created_at ON payment_errors(created_at);

-- ==========================================
-- PAYMENT_SESSIONS TABLE (Optional)
-- ==========================================

CREATE TABLE IF NOT EXISTS payment_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    provider payment_provider NOT NULL,
    session_id VARCHAR(255) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'CHF',
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique session per order and provider
    UNIQUE(order_id, provider, session_id)
);

-- Indexes for payment_sessions
CREATE INDEX IF NOT EXISTS idx_payment_sessions_order_id ON payment_sessions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_provider ON payment_sessions(provider);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_session_id ON payment_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_expires_at ON payment_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_payment_sessions_created_at ON payment_sessions(created_at);

-- ==========================================
-- INFONIQA_SYNC_LOG TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS infoniqa_sync_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sync_status infoniqa_sync_status NOT NULL,
    request_payload JSONB,
    response_payload JSONB,
    error_message TEXT,
    error_code VARCHAR(100),
    attempt_number INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for infoniqa_sync_log
CREATE INDEX IF NOT EXISTS idx_infoniqa_sync_log_order_id ON infoniqa_sync_log(order_id);
CREATE INDEX IF NOT EXISTS idx_infoniqa_sync_log_sync_status ON infoniqa_sync_log(sync_status);
CREATE INDEX IF NOT EXISTS idx_infoniqa_sync_log_created_at ON infoniqa_sync_log(created_at);

-- ==========================================
-- EMAIL_QUEUE TABLE
-- ==========================================

CREATE TABLE IF NOT EXISTS email_queue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    recipient_email VARCHAR(255) NOT NULL,
    recipient_type VARCHAR(50) NOT NULL, -- 'customer' or 'swiss_vfg'
    email_type VARCHAR(50) NOT NULL, -- 'order_confirmation', 'payment_failure', etc.
    subject TEXT NOT NULL,
    body_html TEXT NOT NULL,
    body_text TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    send_attempts INTEGER DEFAULT 0,
    last_attempt_at TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Prevent duplicate emails for same order and type
    UNIQUE(order_id, recipient_email, email_type)
);

-- Indexes for email_queue
CREATE INDEX IF NOT EXISTS idx_email_queue_order_id ON email_queue(order_id);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_created_at ON email_queue(created_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_recipient_type ON email_queue(recipient_type);

-- ==========================================
-- RLS POLICIES
-- ==========================================

-- Enable RLS for new tables
ALTER TABLE payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_errors ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE infoniqa_sync_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

-- Payment events policies
CREATE POLICY "Enable read access for all users" ON payment_events FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON payment_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON payment_events FOR UPDATE USING (true);

-- Payment errors policies
CREATE POLICY "Enable read access for all users" ON payment_errors FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON payment_errors FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON payment_errors FOR UPDATE USING (true);

-- Payment sessions policies
CREATE POLICY "Enable read access for all users" ON payment_sessions FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON payment_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON payment_sessions FOR UPDATE USING (true);

-- Infoniqa sync log policies
CREATE POLICY "Enable read access for all users" ON infoniqa_sync_log FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON infoniqa_sync_log FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON infoniqa_sync_log FOR UPDATE USING (true);

-- Email queue policies
CREATE POLICY "Enable read access for all users" ON email_queue FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON email_queue FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON email_queue FOR UPDATE USING (true);

-- ==========================================
-- FUNCTIONS
-- ==========================================

-- Function to update payment status and trigger side effects
CREATE OR REPLACE FUNCTION update_order_payment_status(
    p_order_id UUID,
    p_new_status payment_status,
    p_provider payment_provider DEFAULT NULL,
    p_payment_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_old_status payment_status;
    v_success BOOLEAN := FALSE;
BEGIN
    -- Get current status
    SELECT payment_status INTO v_old_status
    FROM orders
    WHERE id = p_order_id;
    
    -- Update order
    UPDATE orders
    SET 
        payment_status = p_new_status,
        payment_provider = COALESCE(p_provider, payment_provider),
        provider_payment_id = COALESCE(p_payment_id, provider_payment_id),
        paid_at = CASE 
            WHEN p_new_status = 'paid' AND paid_at IS NULL 
            THEN NOW() 
            ELSE paid_at 
        END,
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Log the status change
    INSERT INTO payment_events (
        order_id,
        provider,
        event_type,
        status_before,
        status_after,
        message
    ) VALUES (
        p_order_id,
        p_provider,
        'status_change',
        v_old_status,
        p_new_status,
        'Payment status updated from ' || v_old_status || ' to ' || p_new_status
    );
    
    -- If payment is successful, queue emails
    IF p_new_status = 'paid' AND v_old_status != 'paid' THEN
        -- Queue customer email
        INSERT INTO email_queue (
            order_id,
            recipient_email,
            recipient_type,
            email_type,
            subject,
            body_html,
            body_text
        )
        SELECT 
            o.id,
            o.customer_email,
            'customer',
            'order_confirmation',
            'Bestellbestätigung - ' || o.order_number,
            '<p>Placeholder - will be generated by application</p>',
            'Placeholder - will be generated by application'
        FROM orders o
        WHERE o.id = p_order_id
        ON CONFLICT (order_id, recipient_email, email_type) DO NOTHING;
        
        -- Queue Swiss VFG email (hardcoded email for now - should be configurable)
        INSERT INTO email_queue (
            order_id,
            recipient_email,
            recipient_type,
            email_type,
            subject,
            body_html,
            body_text
        )
        SELECT 
            o.id,
            'fulfillment@swissvfg.ch', -- This should be configurable
            'swiss_vfg',
            'order_fulfillment',
            'Neue Bestellung - ' || o.order_number,
            '<p>Placeholder - will be generated by application</p>',
            'Placeholder - will be generated by application'
        FROM orders o
        WHERE o.id = p_order_id
        ON CONFLICT (order_id, recipient_email, email_type) DO NOTHING;
        
        -- Mark for Infoniqa sync
        UPDATE orders
        SET infoniqa_sync_status = 'pending'
        WHERE id = p_order_id
        AND infoniqa_sync_status IS NULL;
    END IF;
    
    v_success := TRUE;
    RETURN v_success;
    
EXCEPTION
    WHEN OTHERS THEN
        -- Log error
        INSERT INTO payment_errors (
            order_id,
            provider,
            error_type,
            error_message,
            severity
        ) VALUES (
            p_order_id,
            p_provider,
            'status_update_failed',
            SQLERRM,
            'error'
        );
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired payment sessions
CREATE OR REPLACE FUNCTION cleanup_expired_payment_sessions()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM payment_sessions
    WHERE expires_at < NOW()
    AND order_id IN (
        SELECT id FROM orders 
        WHERE payment_status IN ('pending', 'cancelled', 'expired')
    );
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- VIEWS
-- ==========================================

-- Payment dashboard view for monitoring
CREATE OR REPLACE VIEW payment_dashboard AS
SELECT 
    o.id,
    o.order_number,
    o.customer_name,
    o.customer_email,
    o.total_amount,
    o.currency,
    o.payment_provider,
    o.payment_status,
    o.paid_at,
    o.infoniqa_sync_status,
    o.requires_manual_reconciliation,
    o.created_at,
    COUNT(DISTINCT pe.id) as event_count,
    COUNT(DISTINCT perr.id) as error_count,
    MAX(pe.created_at) as last_event_at
FROM orders o
LEFT JOIN payment_events pe ON o.id = pe.order_id
LEFT JOIN payment_errors perr ON o.id = perr.order_id
WHERE o.payment_provider IS NOT NULL
GROUP BY 
    o.id, o.order_number, o.customer_name, o.customer_email,
    o.total_amount, o.currency, o.payment_provider, o.payment_status,
    o.paid_at, o.infoniqa_sync_status, o.requires_manual_reconciliation,
    o.created_at;

-- Email queue monitoring view
CREATE OR REPLACE VIEW email_queue_status AS
SELECT 
    eq.recipient_type,
    eq.email_type,
    eq.status,
    COUNT(*) as count,
    MIN(eq.created_at) as oldest_pending,
    MAX(eq.created_at) as newest_pending
FROM email_queue eq
GROUP BY eq.recipient_type, eq.email_type, eq.status;

-- ==========================================
-- COMMENTS
-- ==========================================

COMMENT ON COLUMN orders.payment_provider IS 'Payment provider used for this order (stripe or datatrans)';
COMMENT ON COLUMN orders.payment_status IS 'Current payment status';
COMMENT ON COLUMN orders.provider_session_id IS 'Provider-specific session identifier (Stripe Checkout Session ID or DataTrans transaction ID)';
COMMENT ON COLUMN orders.provider_payment_id IS 'Provider-specific payment identifier (Stripe Payment Intent ID or DataTrans payment ID)';
COMMENT ON COLUMN orders.infoniqa_sync_status IS 'Status of synchronization with Infoniqa ONE 200';
COMMENT ON COLUMN orders.infoniqa_transaction_id IS 'Transaction ID in Infoniqa system';
COMMENT ON COLUMN orders.requires_manual_reconciliation IS 'Flag indicating manual intervention needed';
COMMENT ON COLUMN orders.paid_at IS 'Timestamp when payment was confirmed';

COMMENT ON TABLE payment_events IS 'Audit log of all payment-related events';
COMMENT ON TABLE payment_errors IS 'Log of payment processing errors';
COMMENT ON TABLE payment_sessions IS 'Track payment sessions created with providers';
COMMENT ON TABLE infoniqa_sync_log IS 'Log of Infoniqa synchronization attempts';
COMMENT ON TABLE email_queue IS 'Queue for email notifications with retry logic';