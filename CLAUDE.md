# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # prisma generate + Next.js production build
npm run start        # Start production server
npm run lint         # ESLint

# Database
npx prisma migrate dev --name <name>   # Create + apply migration (dev) — interactive
npx prisma migrate deploy              # Apply migrations (prod)
npx prisma generate                    # Regenerate Prisma client
npx prisma studio                      # DB GUI
npx tsx prisma/seed.ts                 # Run seed manually

# Search
npx tsx prisma/algolia-seed.ts         # Sync products to Algolia index
```

Local DB: PostgreSQL on port 5433 (non-standard). Set `DATABASE_URL` in `.env.local`.

## Architecture

Next.js 16 App Router, React 19. No `src/` dir. All pages under `app/`, components under `components/`.

**Key sections:**
- `app/` — pages + API routes (App Router)
- `components/` — organized by domain: `ui/`, `layout/`, `home/`, `catalog/`, `product/`, `cart/`, `checkout/`, `admin/`
- `lib/` — prisma, auth, mercadopago, cloudinary, algolia, email, utils
- `stores/` — Zustand cart store (`adamantio-cart` key in localStorage)
- `types/` — shared TypeScript types (`ProductWithCategory`, `OrderWithItems`, `CartItem`, `ColorVariantProduct`)
- `prisma/` — schema, migrations, seed, algolia-seed, importWoo

**Route protection:** `app/admin/layout.tsx` is a Server Component that checks `getServerSession()` and redirects non-ADMIN users.

**Dynamic pages:** `app/page.tsx` and `app/joyas/page.tsx` export `export const dynamic = "force-dynamic"` to prevent static generation errors during build when DB is unreachable.

**Product catalog:** Lives under `/joyas/` (not `/lentes/` — this was the optics-era route).

## Critical: Prisma 7

This project uses **Prisma 7**, which has breaking changes vs Prisma 5:

- **Driver adapter required.** Never instantiate `new PrismaClient()` without the adapter:
  ```typescript
  import { PrismaPg } from "@prisma/adapter-pg";
  import { PrismaClient } from "@/app/generated/prisma/client";
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  const prisma = new PrismaClient({ adapter });
  ```
- **Generated client path:** `app/generated/prisma/` — import from `@/app/generated/prisma/client` (not `@prisma/client`)
- **Config file:** `prisma.config.ts` at root (not inside `prisma/`), holds datasource URL and seed command
- **Seed runner:** `tsx prisma/seed.ts` (not `ts-node`). Prisma 7 generates ESM-incompatible with ts-node CommonJS mode.
- **Schema:** `generator client { provider = "prisma-client" }` (not `"prisma-client-js"`)

## Critical: Zod 4

Zod 4 (v4.x) renames `.errors` → `.issues`:
```typescript
// ✓ Correct
error.issues[0].message

// ✗ Wrong (Zod 3)
error.errors[0].message
```

## Critical: Tailwind 4

No `tailwind.config.ts`. Custom theme configured via `@theme {}` block in `app/globals.css`. Custom colors: `primary` (#1a1a2e), `accent` (#c9a84c), `surface` (#f8f7f4).

## Auth

NextAuth 4 with JWT strategy. `lib/auth.ts` adds `id` and `role` to JWT token and session. Types augmented in `types/next-auth.d.ts`. Admin credential: `admin@adamantio.com.ar / Admin123!`.

## Payment Flow (Mercado Pago)

Checkout API (no redirect) with `@mercadopago/sdk-react` CardPayment Brick:
1. `POST /api/payments/create-order` → creates Order PENDING in DB, returns `{ orderId, total }`
2. CardPayment Brick tokenizes card
3. `POST /api/payments/process` → calls `paymentClient.create()`, updates Order status, returns result inline
4. Result shown inline on `/checkout` page (no redirect to success/failure pages)

Pages `checkout/success`, `checkout/failure`, `checkout/pending` exist only for external deep links (e.g., from confirmation emails).

## Product Model (Jewelry Fields)

Product schema uses jewelry-specific fields: `material`, `color`, `stonetype`, `finish`, `weight`, `gender`, `brand`. The old optics fields (`frameColor`, `frameMaterial`, `frameType`, `lensType`, `dim*`) were removed in the `jewelry-schema` migration. Do not reference them.

`ColorVariantProduct` type uses `color` (not `frameColor`). Variants are linked via `ProductColorVariant` junction table (self-referential on Product).

## Currency & Locale

Peru. Currency: PEN (Soles). Use `formatPEN()` from `lib/utils.ts`. `formatARS` is a deprecated alias. Locale `es-PE`.

## Search (Algolia)

Products are indexed to Algolia. `lib/algolia.ts` holds the client, `lib/algolia-sync.ts` has sync logic. Run `npx tsx prisma/algolia-seed.ts` to bulk-sync after data changes. Keys in `.env.local`: `NEXT_PUBLIC_ALGOLIA_APP_ID`, `NEXT_PUBLIC_ALGOLIA_SEARCH_KEY`, `ALGOLIA_ADMIN_KEY`.

## Images

- Remote patterns: `res.cloudinary.com` and `images.unsplash.com` (configured in `next.config.ts`)
- Seed data uses Unsplash URLs for product images
- Production uploads use Cloudinary (`CldUploadWidget` unsigned preset `luminus-products`)

## Email

`lib/email.ts` supports both Resend and Nodemailer (SMTP via Hostinger). Config via `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` in `.env.local`.

## Railway Deployment

See `railway.toml`. **Critical:** `prisma migrate deploy` runs in `startCommand`, NOT in `buildCommand`. The internal Railway Postgres network (`postgres.railway.internal`) is unavailable during the build phase.

```toml
[build]
buildCommand = "npm ci && npx prisma generate && npm run build"

[deploy]
startCommand = "npx prisma migrate deploy && npm start"
```

Required environment variables: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `MP_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY`, `NEXT_PUBLIC_APP_URL`. See `.env.example` for the full list.

## Hydration Notes

`<body>` has `suppressHydrationWarning` to handle browser extension attribute injection (e.g., `cz-shortcut-listen`). Do not remove it.

`app/auth/login/page.tsx` wraps `LoginForm` in `<Suspense>` because `useSearchParams()` requires a Suspense boundary in Next.js App Router.
