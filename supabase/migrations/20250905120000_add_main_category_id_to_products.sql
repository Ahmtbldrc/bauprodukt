-- Add main_category_id to products to disambiguate parent main category
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS main_category_id uuid NULL;

-- Add foreign key constraint referencing categories(id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'products'
      AND tc.constraint_name = 'products_main_category_id_fkey'
  ) THEN
    ALTER TABLE public.products
    ADD CONSTRAINT products_main_category_id_fkey
    FOREIGN KEY (main_category_id)
    REFERENCES public.categories(id)
    ON DELETE SET NULL;
  END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_products_main_category_id
ON public.products(main_category_id);


