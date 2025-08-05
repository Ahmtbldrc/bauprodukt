# Enhanced Content System Documentation

## Overview

The Enhanced Content System extends the Swiss VFG scraper with advanced content extraction and PDF processing capabilities. This system provides structured content extraction from product pages, intelligent PDF handling, and comprehensive database integration.

### Key Features

- **Enhanced Content Extraction**: Structured extraction of product tabs (BESCHREIBUNG, TECHNISCHE DATEN, etc.)
- **Intelligent PDF Processing**: Automatic PDF download, storage, and metadata management
- **Hybrid Storage Support**: Local storage with Supabase cloud backup
- **Smart Deduplication**: Hash-based deduplication for both content and PDFs
- **Rich Content Structure**: Hierarchical content organization with metadata

## Database Structure

### 1. Enhanced Products Table

The core `products` table includes the enhanced content field:

```sql
-- products table (enhanced with features_list)
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,
    slug VARCHAR NOT NULL UNIQUE,
    description TEXT,
    price NUMERIC NOT NULL,
    stock INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    brand_id UUID REFERENCES brands(id),
    category_id UUID REFERENCES categories(id),

    -- ENHANCED: Rich content extraction
    features_list JSONB,  -- Structured tab content

    discount_price NUMERIC,
    stock_code VARCHAR,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2. Product PDFs Table

Comprehensive PDF metadata storage with hybrid storage support:

```sql
-- product_pdfs table (complete PDF management)
CREATE TABLE product_pdfs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

    -- File Identification
    filename VARCHAR(255) NOT NULL,
    original_url TEXT NOT NULL,
    tab_section VARCHAR(100),  -- Which tab this PDF came from
    title VARCHAR(255),        -- Display title

    -- Storage Information
    local_path TEXT,           -- Local filesystem path
    supabase_url TEXT,         -- Public Supabase Storage URL
    supabase_path TEXT,        -- Supabase Storage bucket path
    storage_type VARCHAR(20) DEFAULT 'local',  -- local, supabase, both

    -- File Metadata
    file_size VARCHAR(50),     -- Human readable (e.g., "2.3 MB")
    file_size_bytes BIGINT,   -- Exact bytes
    file_hash VARCHAR(64),     -- SHA-256 for deduplication

    -- Upload Tracking
    upload_status VARCHAR(20) DEFAULT 'pending',  -- pending, uploaded, failed, skipped
    download_date TIMESTAMPTZ,
    upload_date TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_product_pdfs_product_id ON product_pdfs(product_id);
CREATE INDEX idx_product_pdfs_hash ON product_pdfs(file_hash);
CREATE INDEX idx_product_pdfs_status ON product_pdfs(upload_status);
```

## Features List Structure

### JSON Schema

The `features_list` field contains hierarchically structured product content:

```json
{
  "TAB_NAME": {
    "content_items": [
      {
        "type": "rich_text",
        "html": "<p>Product description...</p>",
        "text": "Product description..."
      }
    ],
    "pdf_references": [
      {
        "type": "pdf",
        "title": "Technical Specifications",
        "filename": "product_specs.pdf",
        "original_url": "https://swiss-vfg.ch/files/specs.pdf",
        "file_size": "2.3 MB",
        "supabase_url": "https://storage.supabase.co/...",
        "storage_type": "both"
      }
    ],
    "metadata": {
      "extraction_date": "2024-01-15T10:30:00Z",
      "total_items": 15,
      "has_pdfs": true
    }
  }
}
```

### Tab Categories

Common Swiss VFG product tabs extracted:

- **BESCHREIBUNG**: Product descriptions and marketing content
- **TECHNISCHE DATEN**: Technical specifications and data sheets
- **ZUBEHÖR**: Accessories and additional components
- **LIEFERKETTE**: Supply chain information
- **WFW PER UNIT**: Water flow and usage data
- **LIEFERUNG VERSAND**: Shipping and delivery information
- **GESCHÄFTSKUNDEN B2B**: Business customer information

### Content Types

#### 1. Rich Text Content

```json
{
  "type": "rich_text",
  "html": "<div class='spec-table'><h3>Specifications</h3>...</div>",
  "text": "Specifications: Flow rate: 6 L/min, Pressure: 1-5 bar",
  "metadata": {
    "word_count": 45,
    "has_tables": true,
    "extraction_quality": "high"
  }
}
```

#### 2. PDF References

```json
{
  "type": "pdf",
  "title": "Installation Manual",
  "filename": "product_installation.pdf",
  "original_url": "https://swiss-vfg.ch/files/manual.pdf",
  "file_size": "1.2 MB",
  "file_size_bytes": 1258291,
  "file_hash": "sha256:abc123...",
  "local_path": "/data/pdfs/product_installation.pdf",
  "supabase_url": "https://storage.supabase.co/object/public/pdfs/...",
  "storage_type": "both",
  "upload_status": "uploaded"
}
```

#### 3. Structured Data

```json
{
  "type": "structured_data",
  "data": {
    "specifications": {
      "flow_rate": "6 L/min",
      "pressure_range": "1-5 bar",
      "material": "Chrome-plated brass"
    }
  },
  "schema_version": "1.0"
}
```

## Usage Guide

### 1. Accessing Enhanced Content

#### Real Product Example

```json
{
  "id": "1efbdad3-b582-495e-8484-5f89ea6dffbb",
  "name": "Dusch-WC Geberit AquaClean Alba",
  "slug": "dusch-wc-geberit-aquaclean-alba-weiss",
  "price": 1050.0,
  "features_list": {
    "BESCHREIBUNG": {
      "content_items": [
        {
          "type": "rich_text",
          "html": "<p>Das Dusch-WC AquaClean Alba verbindet zeitloses Design mit bewährter Schweizer Qualität.</p>",
          "text": "Das Dusch-WC AquaClean Alba verbindet zeitloses Design mit bewährter Schweizer Qualität."
        }
      ],
      "pdf_references": [],
      "metadata": {
        "extraction_date": "2025-08-05T13:25:00Z",
        "total_items": 8,
        "has_pdfs": false
      }
    },
    "TECHNISCHE DATEN": {
      "content_items": [
        {
          "type": "rich_text",
          "html": "<p>Spülvolumen: 4.5 Liter</p><p>Druckbereich: 1-5 bar</p>",
          "text": "Spülvolumen: 4.5 Liter, Druckbereich: 1-5 bar"
        }
      ],
      "pdf_references": [
        {
          "type": "pdf",
          "title": "Produktdatenblatt",
          "filename": "dusch-wc-geberit-aquaclean-alba-weiss_technische_daten_PRO_3205931-1.pdf",
          "original_url": "https://swiss-vfg.ch/files/PRO_3205931-1.pdf",
          "file_size": "109.5 KB",
          "file_size_bytes": 112247,
          "supabase_url": "https://ccwpzfbdkxgcnmalphap.supabase.co/storage/v1/object/public/pdfs/dusch-wc-geberit-aquaclean-alba-weiss_technische_daten_PRO_3205931-1.pdf",
          "storage_type": "both",
          "upload_status": "uploaded"
        }
      ],
      "metadata": {
        "extraction_date": "2025-08-05T13:25:00Z",
        "total_items": 6,
        "has_pdfs": true
      }
    }
  }
}
```

#### Direct SQL Queries

```sql
-- Get products with enhanced features
SELECT
    name,
    jsonb_array_length(features_list->'TECHNISCHE DATEN'->'content_items') as content_count,
    jsonb_array_length(features_list->'TECHNISCHE DATEN'->'pdf_references') as pdf_count
FROM products
WHERE features_list ? 'TECHNISCHE DATEN';

-- Search within content
SELECT name, slug
FROM products
WHERE features_list @> '{"BESCHREIBUNG": {"content_items": [{"text": "Chrom"}]}}';

-- Get all products with PDFs
SELECT name, slug
FROM products
WHERE jsonb_path_exists(features_list, '$.*."pdf_references"[*]');
```

### 2. PDF Management

#### Sample PDF Records

```json
[
  {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "product_id": "1efbdad3-b582-495e-8484-5f89ea6dffbb",
    "filename": "dusch-wc-geberit-aquaclean-alba-weiss_technische_daten_PRO_3205931-1.pdf",
    "original_url": "https://swiss-vfg.ch/files/PRO_3205931-1.pdf",
    "tab_section": "TECHNISCHE DATEN",
    "title": "Produktdatenblatt",
    "local_path": "/data/pdfs/dusch-wc-geberit-aquaclean-alba-weiss_technische_daten_PRO_3205931-1.pdf",
    "supabase_url": "https://ccwpzfbdkxgcnmalphap.supabase.co/storage/v1/object/public/pdfs/dusch-wc-geberit-aquaclean-alba-weiss_technische_daten_PRO_3205931-1.pdf",
    "supabase_path": "pdfs/dusch-wc-geberit-aquaclean-alba-weiss_technische_daten_PRO_3205931-1.pdf",
    "storage_type": "both",
    "file_size": "109.5 KB",
    "file_size_bytes": 112247,
    "file_hash": "sha256:a1b2c3d4e5f67890abcdef1234567890abcdef1234567890abcdef1234567890",
    "upload_status": "uploaded",
    "download_date": "2025-08-05T13:25:20Z",
    "upload_date": "2025-08-05T13:25:25Z",
    "created_at": "2025-08-05T13:25:20Z",
    "updated_at": "2025-08-05T13:25:25Z"
  },
  {
    "id": "b2c3d4e5-f6g7-8901-bcde-f23456789012",
    "product_id": "2abc3def-4567-890a-bcde-f123456789ab",
    "filename": "dusch-wc-aquaclean-mera-classic_technische_daten_PRO_170112.pdf",
    "original_url": "https://swiss-vfg.ch/files/PRO_170112.pdf",
    "tab_section": "TECHNISCHE DATEN",
    "title": "Produktdatenblatt",
    "local_path": "/data/pdfs/dusch-wc-aquaclean-mera-classic_technische_daten_PRO_170112.pdf",
    "supabase_url": "https://ccwpzfbdkxgcnmalphap.supabase.co/storage/v1/object/public/pdfs/dusch-wc-aquaclean-mera-classic_technische_daten_PRO_170112.pdf",
    "storage_type": "both",
    "file_size": "120.6 KB",
    "file_size_bytes": 123506,
    "upload_status": "uploaded"
  }
]
```

#### SQL PDF Queries

```sql
-- Get PDF statistics
SELECT
    COUNT(*) as total_pdfs,
    COUNT(CASE WHEN upload_status = 'uploaded' THEN 1 END) as uploaded,
    COUNT(CASE WHEN storage_type = 'both' THEN 1 END) as hybrid_storage,
    SUM(file_size_bytes) as total_size_bytes
FROM product_pdfs;

-- Find duplicate PDFs
SELECT file_hash, COUNT(*) as duplicate_count
FROM product_pdfs
WHERE file_hash IS NOT NULL
GROUP BY file_hash
HAVING COUNT(*) > 1;

-- Get recent uploads
SELECT p.name, pdf.title, pdf.file_size, pdf.upload_date
FROM product_pdfs pdf
JOIN products p ON pdf.product_id = p.id
WHERE pdf.upload_date > NOW() - INTERVAL '24 hours'
ORDER BY pdf.upload_date DESC;
```

### 3. Content Extraction Statistics

#### Extraction Performance Example

```json
{
  "scraping_session": {
    "timestamp": "2025-08-05T13:25:00Z",
    "products_processed": 3,
    "enhanced_products": 3,
    "tabs_processed": 20,
    "content_items_extracted": 93,
    "pdfs_found": 3,
    "pdfs_uploaded": 3,
    "processing_time": "51 seconds"
  },
  "content_breakdown": {
    "BESCHREIBUNG": {
      "products_with_tab": 3,
      "avg_content_items": 15,
      "pdfs_found": 0
    },
    "TECHNISCHE DATEN": {
      "products_with_tab": 3,
      "avg_content_items": 6,
      "pdfs_found": 3
    },
    "ZUBEHÖR": {
      "products_with_tab": 2,
      "avg_content_items": 7,
      "pdfs_found": 0
    },
    "LIEFERKETTE": {
      "products_with_tab": 3,
      "avg_content_items": 1,
      "pdfs_found": 0
    }
  }
}
```

#### Database Content Analysis

```json
{
  "database_stats": {
    "total_products": 156,
    "products_with_features_list": 156,
    "enhancement_percentage": 100.0,
    "total_tabs_extracted": 1092,
    "total_pdfs_stored": 45,
    "storage_breakdown": {
      "local_only": 0,
      "supabase_only": 0,
      "both": 45
    },
    "upload_success_rate": 100.0,
    "avg_content_items_per_product": 18.5,
    "avg_pdfs_per_product": 0.8
  }
}
```

## Configuration

### Environment Variables

```bash
# Enhanced Content Configuration
ENABLE_ENHANCED_EXTRACTION=true
ENHANCED_EXTRACTION_TABS=BESCHREIBUNG,TECHNISCHE_DATEN,ZUBEHÖR

# PDF Storage Configuration
PDF_STORAGE_TYPE=both                    # local, supabase, both
SUPABASE_PDFS_BUCKET=pdfs               # Storage bucket name
PDF_MAX_SIZE=10485760                    # 10MB max file size
PDF_DEDUPLICATION_ENABLED=true          # Enable hash-based deduplication

# Processing Configuration
MAX_CONTENT_ITEMS_PER_TAB=50            # Content extraction limits
PDF_UPLOAD_BATCH_SIZE=5                 # Concurrent uploads
PDF_UPLOAD_RETRY_ATTEMPTS=3             # Upload retry count
```

### Configuration Example

```bash
# Environment Variables (.env file)
ENABLE_ENHANCED_EXTRACTION=true
ENHANCED_EXTRACTION_TABS=BESCHREIBUNG,TECHNISCHE DATEN,ZUBEHÖR,LIEFERKETTE
MAX_CONTENT_ITEMS_PER_TAB=50
PDF_STORAGE_TYPE=both
SUPABASE_PDFS_BUCKET=pdfs
PDF_MAX_SIZE=10485760
PDF_DEDUPLICATION_ENABLED=true
PDF_UPLOAD_BATCH_SIZE=5
PDF_UPLOAD_RETRY_ATTEMPTS=3
```

## Advanced Usage

### 1. Content Analysis Results

#### Coverage Analysis Example

```json
{
  "content_coverage_analysis": {
    "total_products": 156,
    "products_with_features": 156,
    "products_with_pdfs": 45,
    "coverage_percentage": 100.0,
    "pdf_coverage_percentage": 28.8,
    "tab_distribution": {
      "BESCHREIBUNG": 156,
      "TECHNISCHE DATEN": 156,
      "ZUBEHÖR": 98,
      "LIEFERKETTE": 156,
      "WFW PER UNIT": 142,
      "LIEFERUNG VERSAND": 156,
      "GESCHÄFTSKUNDEN B2B": 156
    }
  }
}
```

### 2. Search Results Example

#### Content Search Results

```json
{
  "search_term": "Chrom",
  "total_matches": 34,
  "results": [
    {
      "product_id": "1efbdad3-b582-495e-8484-5f89ea6dffbb",
      "product_name": "Dusch-WC Geberit AquaClean Alba",
      "product_slug": "dusch-wc-geberit-aquaclean-alba-weiss",
      "tab": "BESCHREIBUNG",
      "context": "Hochwertige Chrom-Oberfläche mit kratzfester Beschichtung. Das zeitlose Design passt perfekt in moderne Badezimmer...",
      "match_score": 0.95
    },
    {
      "product_id": "2abc3def-4567-890a-bcde-f123456789ab",
      "product_name": "Waschtischarmatur VFG Principal",
      "product_slug": "waschtischarmatur-vfg-principal-matt-schwarz-small",
      "tab": "TECHNISCHE DATEN",
      "context": "Material: Verchromtes Messing, Chrom-Finish mit Anti-Fingerprint-Beschichtung. Durchflussrate: 6 L/min bei 3 bar...",
      "match_score": 0.88
    }
  ]
}
```

### 3. PDF Management Dashboard Data

#### Product PDF Summary

```json
{
  "product_pdf_management": {
    "product_id": "1efbdad3-b582-495e-8484-5f89ea6dffbb",
    "product_name": "Dusch-WC Geberit AquaClean Alba",
    "total_pdfs": 1,
    "uploaded_successfully": 1,
    "failed_uploads": 0,
    "storage_breakdown": {
      "local": 0,
      "supabase": 0,
      "both": 1
    },
    "total_storage_size": "109.5 KB",
    "total_storage_bytes": 112247,
    "pdfs": [
      {
        "title": "Produktdatenblatt",
        "tab_section": "TECHNISCHE DATEN",
        "file_size": "109.5 KB",
        "upload_status": "uploaded",
        "storage_type": "both",
        "download_url": "https://ccwpzfbdkxgcnmalphap.supabase.co/storage/v1/object/public/pdfs/dusch-wc-geberit-aquaclean-alba-weiss_technische_daten_PRO_3205931-1.pdf"
      }
    ]
  }
}
```

## Performance Considerations

### Database Indexing

```sql
-- Optimize features_list queries
CREATE INDEX idx_products_features_list ON products USING gin(features_list);

-- PDF lookup optimization
CREATE INDEX idx_product_pdfs_composite ON product_pdfs(product_id, upload_status);
CREATE INDEX idx_product_pdfs_hash_lookup ON product_pdfs(file_hash) WHERE file_hash IS NOT NULL;
```

### Query Optimization

```sql
-- Efficient content queries
SELECT name,
       jsonb_path_query_first(features_list, '$."TECHNISCHE DATEN"."metadata"."total_items"') as tech_items
FROM products
WHERE features_list ? 'TECHNISCHE DATEN';

-- PDF availability check
SELECT p.name,
       COUNT(pdf.id) as pdf_count,
       COUNT(CASE WHEN pdf.upload_status = 'uploaded' THEN 1 END) as available_pdfs
FROM products p
LEFT JOIN product_pdfs pdf ON p.id = pdf.product_id
GROUP BY p.id, p.name;
```

## Troubleshooting

### Common Issues

#### 1. Missing Enhanced Content

```bash
# Check configuration
grep "ENABLE_ENHANCED_EXTRACTION" .env
# Should show: ENABLE_ENHANCED_EXTRACTION=true

# Check database for empty features_list
SELECT COUNT(*) as empty_features
FROM products
WHERE features_list IS NULL;
# Should be 0 for fully enhanced database
```

#### 2. PDF Upload Failures

```sql
-- Check failed PDF uploads
SELECT
    filename,
    original_url,
    upload_status,
    created_at
FROM product_pdfs
WHERE upload_status = 'failed'
ORDER BY created_at DESC;
```

**Sample Failed Upload Record:**

```json
{
  "filename": "large_technical_manual.pdf",
  "original_url": "https://swiss-vfg.ch/files/large_manual.pdf",
  "upload_status": "failed",
  "error_reason": "File too large: 12425490 bytes (max: 10485760)"
}
```

#### 3. Storage Configuration Issues

```bash
# Check environment variables
echo "PDF Storage Type: $PDF_STORAGE_TYPE"
echo "Supabase Bucket: $SUPABASE_PDFS_BUCKET"
echo "Max PDF Size: $PDF_MAX_SIZE"

# Verify bucket exists
python3 -c "
import os;
from database.supabase_client import SupabaseClient;
db = SupabaseClient();
db.connect();
buckets = db.supabase.storage.list_buckets();
print('Available buckets:', [b.name for b in buckets])
"
```

### Monitoring Queries

```sql
-- Content extraction health check
SELECT
    COUNT(*) as total_products,
    COUNT(CASE WHEN features_list IS NOT NULL THEN 1 END) as enhanced_count,
    ROUND(
        COUNT(CASE WHEN features_list IS NOT NULL THEN 1 END) * 100.0 / COUNT(*), 2
    ) as enhancement_percentage
FROM products;

-- PDF system health check
SELECT
    upload_status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM product_pdfs
GROUP BY upload_status;

-- Recent extraction activity
SELECT
    DATE(created_at) as date,
    COUNT(*) as products_added,
    COUNT(CASE WHEN features_list IS NOT NULL THEN 1 END) as enhanced_products
FROM products
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

## Migration and Maintenance

### Content Schema Evolution

When updating the features_list structure:

```sql
-- Backup existing content
CREATE TABLE products_features_backup AS
SELECT id, features_list FROM products WHERE features_list IS NOT NULL;

-- Update schema (example: add version field)
UPDATE products
SET features_list = jsonb_set(
    features_list,
    '{_schema_version}',
    '"2.0"'
)
WHERE features_list IS NOT NULL;
```

### PDF Cleanup Operations

```sql
-- Remove orphaned PDF records
DELETE FROM product_pdfs
WHERE product_id NOT IN (SELECT id FROM products);

-- Clean up failed uploads older than 30 days
DELETE FROM product_pdfs
WHERE upload_status = 'failed'
  AND created_at < NOW() - INTERVAL '30 days';
```

This enhanced content system provides a robust foundation for rich product information management, combining structured content extraction with intelligent PDF handling for comprehensive e-commerce data solutions.
