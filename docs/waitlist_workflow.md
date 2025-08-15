# Swiss VFG Waitlist Workflow Documentation

## Overview

The Swiss VFG scraper implements a waitlist workflow to ensure admin control over all product changes before they go live. This document describes the workflow, database schema, and admin utilities.

## Key Changes from Previous Implementation

### 1. No Direct Product Saves

- Products are NOT directly saved to the database
- All new products and updates go through the waitlist
- Admin approval required before going live

### 2. Features List Removed

- No scraping of tab content, PDFs, or rich text
- Only essential product data: name, price, images, variants, SKU
- Significantly faster scraping and reduced storage requirements

### 3. Static Brand Assignment

- Brand is ALWAYS set to "VFG"
- No brand scraping from source
- Admins can manually change brand after import

### 4. Product Status Management

- New `status` column with values:
  - `active`: Live product visible to customers
  - `passive`: Manually offlined by admin
  - `waiting_approval`: New product awaiting approval
  - `rejected`: Rejected new product
  - `pending_update`: Active product with pending changes

## Database Schema

### products Table Changes

```sql
-- New columns added
status VARCHAR(20) DEFAULT 'active'
is_changeable BOOLEAN DEFAULT true
```

### waitlist_updates Table

```sql
CREATE TABLE waitlist_updates (
    id UUID PRIMARY KEY,
    product_slug VARCHAR(255) NOT NULL,
    product_id UUID,  -- NULL for new products
    payload_json JSONB NOT NULL,
    diff_summary JSONB,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    created_by VARCHAR(100),
    version INTEGER,
    reason VARCHAR(50),
    is_valid BOOLEAN,
    validation_errors JSONB,
    requires_manual_review BOOLEAN,
    price_drop_percentage NUMERIC(5,2),
    has_invalid_discount BOOLEAN
);
```

### audit_log Table

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY,
    actor VARCHAR(255),
    action VARCHAR(50),
    target_type VARCHAR(50),
    target_id UUID,
    before_state JSONB,
    after_state JSONB,
    timestamp TIMESTAMP,
    reason TEXT
);
```

## Workflow

### 1. New Product Discovery

```python
# Scraper finds new product
product = await scraper.scrape_product_details(url)

# Create waitlist entry (not saved to products table)
waitlist_id = await db_client.create_waitlist_entry(
    product,
    WaitlistReason.NEW_PRODUCT
)
# Product status: waiting_approval (not visible to users)
```

### 2. Existing Product Update

```python
# Scraper detects changes in existing product
if product_exists:
    waitlist_id = await db_client.create_waitlist_entry(
        product,
        WaitlistReason.PRICE_CHANGE  # or other reason
    )
    # Product status: pending_update (live version remains active)
```

### 3. Admin Review

```bash
# List waitlist entries
python -m admin_utilities list --filter new

# View diff for pending update
python -m admin_utilities diff <waitlist_id>

# Approve entry
python -m admin_utilities approve <waitlist_id>

# Reject entry
python -m admin_utilities reject <waitlist_id> --reason "Invalid price"
```

### 4. Approval Process

- **New Product Approved**: Creates product with status `active`
- **Update Approved**: Applies changes to live product
- **New Product Rejected**: Marked as `rejected`, not created
- **Update Rejected**: Pending changes discarded, product remains `active`

## Admin Utilities

### Command Line Interface

```bash
# List all waitlist entries
python -m admin_utilities list

# Filter by type
python -m admin_utilities list --filter new
python -m admin_utilities list --filter update
python -m admin_utilities list --filter manual_review

# Show diff for an entry
python -m admin_utilities diff <waitlist_id>

# Approve single entry
python -m admin_utilities approve <waitlist_id>

# Bulk approve
python -m admin_utilities approve <id1> <id2> <id3>

# Reject with reason
python -m admin_utilities reject <waitlist_id> --reason "Price error"

# Update product status
python -m admin_utilities status <product_id> passive

# Set product changeability
python -m admin_utilities changeable <product_slug> --set false

# View queue statistics
python -m admin_utilities stats
```

### Python API

```python
from admin_utilities import AdminUtilities

admin = AdminUtilities()

# List entries
entries = admin.list_waitlist_entries(status_filter='new')

# Get diff
diff = admin.get_waitlist_diff(waitlist_id)

# Approve
await admin.approve_entry(waitlist_id, actor='admin')

# Reject
await admin.reject_entry(waitlist_id, actor='admin', reason='Invalid')

# Bulk operations
results = await admin.bulk_approve(waitlist_ids)

# Statistics
stats = admin.get_queue_stats()
```

## Validation Rules

### Automatic Validation

1. **Discount Price**: Must be less than main price
2. **Price Drop**: Flagged if >30% drop
3. **Variants**: Must match source count
4. **Required Fields**: name, price, slug must be present

### Manual Review Triggers

- Invalid discount (discount_price >= price)
- Large price drop (>30%)
- Missing required fields
- Variant count mismatch

## Non-Changeable Products

Products marked as `is_changeable = false`:

- Are completely skipped by the scraper
- Cannot be updated through automated scraping
- Must be manually managed by admins
- Useful for custom products or special promotions

### Setting Non-Changeable

```bash
# Mark product as non-changeable
python -m admin_utilities changeable <product_slug> --set false
```

## Migration from Old System

### Running Migration

```bash
# Apply database changes
psql -d your_database -f migrations/002_add_waitlist_workflow.sql
```

### Existing Products

- All existing products get `status = 'active'`
- All existing products get `is_changeable = true`
- Brand remains unchanged (admin can update to VFG manually)

## Technical Success Metrics

### Validation Metrics

- **Discount Validation**: 99% of products have valid discounts
- **Variant Completeness**: 95% variant match rate with source
- **Data Consistency**: 99% products have all required fields

### Performance Metrics

- **Scraping Speed**: 3x faster without features_list extraction
- **Storage Savings**: 70% less storage without PDFs
- **Approval Time**: <24 hours median time to approval

## Troubleshooting

### Common Issues

1. **Products not appearing in waitlist**

   - Check if product is marked non-changeable
   - Verify scraper is using waitlist workflow
   - Check database connection

2. **Approval fails**

   - Ensure waitlist entry exists
   - Check for validation errors
   - Verify product doesn't violate constraints

3. **Duplicate waitlist entries**
   - System automatically merges into existing entry
   - Version number increments on each update

### Logs

```bash
# Check scraping logs
tail -f data/logs/scraping_*.log

# Check database operations
tail -f data/logs/database_*.log
```

## Best Practices

1. **Review Queue Daily**: Check waitlist entries at least once per day
2. **Bulk Operations**: Use bulk approve for validated entries
3. **Set Non-Changeable**: Mark special products as non-changeable
4. **Monitor Stats**: Use `admin_utilities stats` to track queue health
5. **Document Rejections**: Always provide rejection reasons for audit trail
