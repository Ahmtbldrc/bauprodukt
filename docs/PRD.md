# 🧠 Cursor için Kullanıma Hazır AI Prompt: Next.js E-Commerce Projesi

Create a complete Next.js e-commerce project with the following requirements:

## 📌 Project Definition

This is an e-commerce web application (like Koçtaş/Bauhaus) built using a single Next.js project. It should support a wide product hierarchy: Brand > Category > Product. The MVP version will not include authentication, but must support product listing, product detail pages, an admin panel for product management, and image upload using Supabase Storage.

## 🔧 Technologies

- Next.js 14+ with App Router
- TypeScript
- Tailwind CSS
- shadcn/ui for components
- Supabase SDK (not Prisma)
- Zod for validation
- React Hook Form
- TanStack React Query
- Supabase Storage for image upload

## 📁 Folder Structure (under src/)

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx (home)
│   ├── [brand]/[category]/[product]/page.tsx
│   ├── admin/
│   │   ├── layout.tsx
│   │   └── products/page.tsx
│   └── api/
│       ├── products/route.ts  // API routes for GET/POST products
│       └── upload/route.ts    // Image upload using Supabase Storage
├── components/                // Shared UI components
├── lib/
│   ├── supabaseClient.ts      // Supabase client setup
│   └── upload.ts              // helper for file upload
├── types/
│   └── product.ts
├── schemas/
│   └── productSchema.ts       // Zod schema
├── styles/
│   └── globals.css
```

## 🌐 Supabase

Use Supabase SDK (@supabase/supabase-js) to interact with the database and Supabase Storage. Assume the environment variables `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` will be provided.

## 🧩 Functional Modules to Support

- Product listing (public)
- Product detail (public)
- Admin panel to add/edit products
- Upload images to Supabase Storage (single image per product for MVP)
- Data fetching with React Query
- Validated forms with React Hook Form + Zod
- Tailwind-based UI with shadcn/ui components

## 🛠️ Setup

- Bootstrap the project with `npx create-next-app` with `--tailwind`, `--typescript`, `--app`, and `--src-dir`
- Install dependencies listed above
- Configure `tailwind.config.ts`, `postcss.config.js`
- Add shadcn config via `npx shadcn-ui init` and set base alias to `@`
- Create initial layout and pages for the frontend and admin routes
- Create `supabaseClient.ts` for SDK access
- Setup dummy form in `/admin/products` for adding a product using RHF + Zod
- Ensure `/api/products` and `/api/upload` endpoints are working with Supabase

## 📦 Output

Generate the entire working boilerplate ready for development. Use placeholder implementations where necessary.

## ⏱️ Focus on

Developer speed, clean architecture, and Supabase SDK-first logic.

## 🧠 Note

No auth integration is needed for MVP. 