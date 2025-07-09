# Bauprodukt Demo - E-Commerce Platform

A modern e-commerce web application built with Next.js 14, Supabase, and TailwindCSS. This project supports a hierarchical product structure (Brand > Category > Product) and includes an admin panel for product management.

## 🚀 Features

- **Product Management**: Full CRUD operations for products, brands, and categories
- **Image Upload**: Supabase Storage integration for product images
- **Admin Panel**: Management interface for products
- **Responsive Design**: Built with TailwindCSS and shadcn/ui
- **Type Safety**: Full TypeScript support with Zod validation
- **Modern Stack**: Next.js 14 App Router, React Query, and Supabase

## 🛠️ Tech Stack

- **Framework**: Next.js 14 with App Router
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **Styling**: TailwindCSS + shadcn/ui
- **State Management**: TanStack React Query
- **Validation**: Zod
- **Forms**: React Hook Form
- **Language**: TypeScript

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout with providers
│   ├── page.tsx                      # Home page
│   ├── [brand]/[category]/[product]/ # Dynamic product pages
│   ├── admin/
│   │   ├── layout.tsx               # Admin layout
│   │   └── products/page.tsx        # Product management
│   └── api/
│       ├── products/route.ts        # Products API
│       └── upload/route.ts          # File upload API
├── components/
│   └── providers.tsx                # React Query provider
├── lib/
│   ├── supabase.ts                  # Supabase client
│   ├── query-client.ts              # React Query setup
│   └── upload.ts                    # File upload helpers
├── types/
│   └── database.ts                  # Database types
├── schemas/
│   └── database.ts                  # Zod validation schemas
└── styles/
    └── globals.css                  # Global styles
```

## 🗄️ Database Schema

```sql
-- Brands (Markalar)
CREATE TABLE IF NOT EXISTS brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Categories (Kategoriler)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Products (Ürünler)
CREATE TABLE IF NOT EXISTS products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  stock INTEGER NOT NULL,
  image_url TEXT,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Banners (Anasayfa Bannerları)
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  image_url TEXT NOT NULL,
  link TEXT,
  order_index INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Product Images (çoklu görsel desteği)
CREATE TABLE IF NOT EXISTS product_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

## ⚙️ Setup Instructions

### 1. Clone the repository

```bash
git clone <repository-url>
cd bauprodukt-demo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Optional: For development
NODE_ENV=development
```

### 4. Database Setup

1. Create a new Supabase project
2. Run the database schema (SQL above) in Supabase SQL Editor
3. Set up Row Level Security (RLS) policies as needed
4. Create a storage bucket named `images` for file uploads

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## 🔧 Additional Setup

### shadcn/ui Components

Install required components:

```bash
npx shadcn-ui@latest add button input label form card
```

### Required Dependencies

Make sure these packages are installed:

```bash
npm install @supabase/supabase-js zod react-hook-form @hookform/resolvers @tanstack/react-query
```

## 🎯 MVP Features

- ✅ Product listing (public)
- ✅ Admin panel for product management
- ✅ Image upload with Supabase Storage
- ✅ Form validation with Zod + React Hook Form
- ✅ Data fetching with React Query
- ✅ TypeScript + Tailwind setup

## 🚫 Not Included in MVP

- Authentication (will be added later)
- User registration/login
- Shopping cart functionality
- Payment processing
- Product reviews

## 📚 Learn More

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TailwindCSS Documentation](https://tailwindcss.com/docs)
- [shadcn/ui Documentation](https://ui.shadcn.com)
- [React Query Documentation](https://tanstack.com/query/latest)
