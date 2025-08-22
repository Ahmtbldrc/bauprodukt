-- ==========================================
-- PRODUCT MEDIA TABLES MIGRATION
-- ==========================================
-- Product documents, videos, and conversion factors tables
-- This migration adds support for comprehensive media management

-- ==========================================
-- PRODUCT DOCUMENTS TABLE
-- ==========================================

CREATE TABLE product_documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_type VARCHAR(50),
    file_size INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product documents indexes
CREATE INDEX idx_product_documents_product ON product_documents(product_id);
CREATE INDEX idx_product_documents_active ON product_documents(is_active) WHERE is_active = true;
CREATE INDEX idx_product_documents_created_at ON product_documents(created_at);
CREATE INDEX idx_product_documents_file_type ON product_documents(file_type);

-- Product documents RLS
ALTER TABLE product_documents ENABLE ROW LEVEL SECURITY;

-- Product documents policies
CREATE POLICY "Enable read access for all users" ON product_documents FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON product_documents FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON product_documents FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON product_documents FOR DELETE USING (auth.role() = 'authenticated');

-- ==========================================
-- PRODUCT VIDEOS TABLE
-- ==========================================

CREATE TABLE product_videos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    video_url TEXT NOT NULL,
    thumbnail_url TEXT,
    duration INTEGER, -- duration in seconds
    file_size INTEGER, -- file size in bytes
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Product videos indexes
CREATE INDEX idx_product_videos_product ON product_videos(product_id);
CREATE INDEX idx_product_videos_active ON product_videos(is_active) WHERE is_active = true;
CREATE INDEX idx_product_videos_created_at ON product_videos(created_at);
CREATE INDEX idx_product_videos_duration ON product_videos(duration);

-- Product videos RLS
ALTER TABLE product_videos ENABLE ROW LEVEL SECURITY;

-- Product videos policies
CREATE POLICY "Enable read access for all users" ON product_videos FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON product_videos FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON product_videos FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON product_videos FOR DELETE USING (auth.role() = 'authenticated');

-- ==========================================
-- PRODUCT CONVERSION FACTORS TABLE
-- ==========================================

CREATE TABLE product_conversion_factors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    length_units BOOLEAN NOT NULL DEFAULT true,
    weight_units BOOLEAN NOT NULL DEFAULT true,
    volume_units BOOLEAN NOT NULL DEFAULT false,
    temperature_units BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id) -- One conversion factor set per product
);

-- Product conversion factors indexes
CREATE INDEX idx_product_conversion_factors_product ON product_conversion_factors(product_id);

-- Product conversion factors RLS
ALTER TABLE product_conversion_factors ENABLE ROW LEVEL SECURITY;

-- Product conversion factors policies
CREATE POLICY "Enable read access for all users" ON product_conversion_factors FOR SELECT USING (true);
CREATE POLICY "Enable insert for authenticated users" ON product_conversion_factors FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Enable update for authenticated users" ON product_conversion_factors FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Enable delete for authenticated users" ON product_conversion_factors FOR DELETE USING (auth.role() = 'authenticated');

-- ==========================================
-- UPDATE TRIGGERS
-- ==========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_product_documents_updated_at 
    BEFORE UPDATE ON product_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_videos_updated_at 
    BEFORE UPDATE ON product_videos 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_conversion_factors_updated_at 
    BEFORE UPDATE ON product_conversion_factors 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==========================================
-- USEFUL VIEWS
-- ==========================================

-- Products with media summary
CREATE VIEW products_with_media_summary AS
SELECT 
    p.*,
    COALESCE(img_count.count, 0) as image_count,
    COALESCE(doc_count.count, 0) as document_count,
    COALESCE(vid_count.count, 0) as video_count,
    cf.length_units,
    cf.weight_units,
    cf.volume_units,
    cf.temperature_units
FROM products p
LEFT JOIN (
    SELECT product_id, COUNT(*) as count 
    FROM product_images 
    GROUP BY product_id
) img_count ON p.id = img_count.product_id
LEFT JOIN (
    SELECT product_id, COUNT(*) as count 
    FROM product_documents 
    WHERE is_active = true
    GROUP BY product_id
) doc_count ON p.id = doc_count.product_id
LEFT JOIN (
    SELECT product_id, COUNT(*) as count 
    FROM product_videos 
    WHERE is_active = true
    GROUP BY product_id
) vid_count ON p.id = vid_count.product_id
LEFT JOIN product_conversion_factors cf ON p.id = cf.product_id;

-- ==========================================
-- COMMENTS FOR DOCUMENTATION
-- ==========================================

COMMENT ON TABLE product_documents IS 'Product documents and PDFs storage';
COMMENT ON TABLE product_videos IS 'Product videos and media files';
COMMENT ON TABLE product_conversion_factors IS 'Product unit conversion settings';
COMMENT ON VIEW products_with_media_summary IS 'Products with media count summary';
