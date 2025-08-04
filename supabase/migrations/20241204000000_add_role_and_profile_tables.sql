-- ==========================================
-- ROLE AND PROFILE TABLES MIGRATION
-- ==========================================
-- Kullanıcı rolleri ve profil yönetimi için gerekli tablolar

-- ==========================================
-- ROLES TABLE
-- ==========================================

CREATE TABLE roles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Roles tablosu için indexler
CREATE INDEX idx_roles_slug ON roles(slug);
CREATE INDEX idx_roles_name ON roles(name);
CREATE INDEX idx_roles_is_active ON roles(is_active);
CREATE INDEX idx_roles_created_at ON roles(created_at);

-- Active roles için composite index
CREATE INDEX idx_roles_active_name ON roles(is_active, name) WHERE is_active = true;

-- Roles tablosu için RLS
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Roles için public access policy'leri
CREATE POLICY "Enable read access for all users" ON roles FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON roles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON roles FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON roles FOR DELETE USING (true);

-- ==========================================
-- PROFILES TABLE
-- ==========================================

CREATE TABLE profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    birth_date DATE,
    avatar_url TEXT,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles tablosu için indexler
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_role_id ON profiles(role_id);
CREATE INDEX idx_profiles_phone ON profiles(phone);
CREATE INDEX idx_profiles_is_active ON profiles(is_active);
CREATE INDEX idx_profiles_created_at ON profiles(created_at);

-- Full name için composite index
CREATE INDEX idx_profiles_full_name ON profiles(first_name, last_name);

-- Active profiles için composite index
CREATE INDEX idx_profiles_active_role ON profiles(is_active, role_id) WHERE is_active = true;

-- Profiles tablosu için RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Profiles için public access policy'leri
CREATE POLICY "Enable read access for all users" ON profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON profiles FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON profiles FOR DELETE USING (true);

-- ==========================================
-- FUNCTIONS AND TRIGGERS
-- ==========================================

-- Profile updated_at trigger function
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER profiles_update_timestamp
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_profiles_updated_at();

-- ==========================================
-- DEFAULT ROLES
-- ==========================================

-- Varsayılan rolleri ekle
INSERT INTO roles (name, slug, description, permissions, is_active) VALUES
('Admin', 'admin', 'Sistem yöneticisi - tüm yetkilere sahip', '{"all": true}', true),
('Manager', 'manager', 'Mağaza yöneticisi - ürün ve sipariş yönetimi', '{"products": true, "orders": true, "customers": true}', true),
('Customer', 'customer', 'Müşteri - sipariş verme yetkisi', '{"orders": false, "profile": true}', true),
('Guest', 'guest', 'Misafir kullanıcı - sadece görüntüleme', '{}', true);

-- ==========================================
-- USEFUL VIEWS
-- ==========================================

-- Profile detayları view (role bilgisi ile birlikte)
CREATE VIEW profile_details AS
SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    CONCAT(p.first_name, ' ', p.last_name) as full_name,
    p.phone,
    p.birth_date,
    p.avatar_url,
    p.is_active,
    p.created_at,
    p.updated_at,
    r.id as role_id,
    r.name as role_name,
    r.slug as role_slug,
    r.description as role_description,
    r.permissions as role_permissions
FROM profiles p
JOIN roles r ON p.role_id = r.id;

-- Active profiles view
CREATE VIEW active_profiles AS
SELECT * FROM profile_details 
WHERE is_active = true;

-- Role özeti view
CREATE VIEW role_summary AS
SELECT 
    r.id,
    r.name,
    r.slug,
    r.description,
    r.permissions,
    r.is_active,
    r.created_at,
    COUNT(p.id) as profile_count,
    COUNT(CASE WHEN p.is_active = true THEN 1 END) as active_profile_count
FROM roles r
LEFT JOIN profiles p ON r.id = p.role_id
GROUP BY r.id, r.name, r.slug, r.description, r.permissions, r.is_active, r.created_at;