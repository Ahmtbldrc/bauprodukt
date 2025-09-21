-- Add file_key column to product_documents table for S3/MinIO storage
ALTER TABLE product_documents 
ADD COLUMN IF NOT EXISTS file_key TEXT;

-- Add index for file_key for better query performance
CREATE INDEX IF NOT EXISTS idx_product_documents_file_key 
ON product_documents(file_key) 
WHERE file_key IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN product_documents.file_key IS 'S3/MinIO object key for document storage';