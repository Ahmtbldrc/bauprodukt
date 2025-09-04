-- Add category_type column to distinguish main vs sub categories explicitly
-- Values: 'main' or 'sub'. Default is 'main'.

alter table public.categories
  add column if not exists category_type text not null default 'main'
  check (category_type in ('main','sub'));

-- Backfill existing data: infer from parent_id
update public.categories
set category_type = case when parent_id is null then 'main' else 'sub' end
where category_type is null or category_type not in ('main','sub');

-- Optional: index to speed up filtering
create index if not exists idx_categories_category_type on public.categories (category_type);


