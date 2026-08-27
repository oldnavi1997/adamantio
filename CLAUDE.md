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
- `lib/` — prisma, auth, cloudinary, algolia, email, push, utils; payments: `mercadopago`, `izipay`(+`izipay-result`), `culqi`(+`culqi-result`), `fulfillment`, `shipping`
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

NextAuth 4 with JWT strategy. `lib/auth.ts` adds `id` and `role` to JWT token and session. Types augmented in `types/next-auth.d.ts`. Admin credential: `admin@adamantio.com / admin123`.

## Payment Flow (Culqi, Izipay)

The checkout offers **two** gateways, both resolved inline on `/checkout` — no redirect. Every
one starts with `POST /api/payments/create-order`, which creates the Order `PENDING` and fixes
the real amount: prices come from the DB, and `getPaymentFee(provider, base)` decides the
commission passed on to the buyer, so **switching gateway recreates the order**.

Each gateway is behind a credentials feature flag (`culqiConfigured()`, `izipayConfigured()`).
Without keys its tab is not rendered and its routes return 503, so the app deploys unconfigured.
Both answer with the same shape — `{ status, paymentId, statusDetail }` — so `CheckoutClient`
doesn't branch per gateway. With no gateway configured there is no fallback: the payment step
renders a notice instead of a broken form.

**Mercado Pago was withdrawn from the checkout**, not deleted. `/api/payments/process`, the IPN
at `/api/payments/webhook`, `lib/mercadopago.ts`, `components/checkout/CardPaymentBrick.tsx`,
its `getPaymentFee` branch and its `PROVIDER_LABELS` entry all stay, so existing `mercadopago`
orders still resolve and the admin still labels them. To bring it back, restore its tab and
branch in `CheckoutClient`. Note the brick also carried the dev-only "Simular pago aprobado"
button (`devBypass`), which went with it. `MP_ACCESS_TOKEN` is still required: the surviving
routes construct the client at module load.

- **Izipay** (Lyra/Krypton V4) — `POST /api/payments/izipay/session` returns a `formToken`; the
  embedded form charges; `/izipay/confirm` and the IPN `/izipay/webhook` both validate the
  `kr-hash` **over the raw string** before parsing. Two different keys sign it; see `lib/izipay.ts`.
- **Culqi** (card + Yape) — the browser only tokenizes with the Custom Checkout;
  `POST /api/payments/culqi/charge` runs the charge server-side. HTTP 201 = paid, **200 = 3DS
  required** (answer `auth_required`, the browser runs `Culqi3DS.initAuthentication` and calls
  again with `authentication3DS`; same token and `device_finger_print_id` both times), 4xx =
  rejected. `metadata.orderId` is the only link back to the order, and `/culqi/webhook`
  re-fetches the charge rather than trusting its body.

### Never approve an order outside `aprobarOrden`

`lib/fulfillment.ts` is the single approval path. It does a compare-and-swap on
`Order.stockDeducted` inside a transaction, locks the product rows with `SELECT … FOR UPDATE`
(the POS writes the same rows) and upserts the `Payment`. Every gateway has two racing paths —
browser response and webhook — so a plain `order.update({ status: "PAID" })` would double-deduct
stock. Callers only send the email/push when `yaProcesada` is false, and use `after()` from
`next/server` for it: on Vercel the lambda freezes as soon as it responds.

Pages `checkout/success`, `checkout/failure`, `checkout/pending` exist only for external deep
links (e.g., from confirmation emails); the live flow goes to `/pedido/confirmacion/[orderId]`.

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

`lib/email.ts` sends via **Resend only** (the `nodemailer` dependency is left over and unused). Config: `RESEND_API_KEY` + `EMAIL_FROM` in `.env.local`.

`EMAIL_FROM` must belong to a domain verified at resend.com/domains. `onboarding@resend.dev` only delivers to the Resend account owner and silently 403s every other recipient — Resend's SDK returns `{ data, error }` instead of throwing, so always check `error`.

## Libro de Reclamaciones (Indecopi)

Legally mandated complaints book (Ley 29571 art. 150, D.S. 011-2011-PCM). Not a generic contact form — the rules below are legal requirements, not preferences.

- **Public form:** `/libro-de-reclamaciones` → `components/legal/ReclamacionForm.tsx` → `POST /api/reclamaciones`
- **Admin:** `/admin/reclamaciones` (list + filters) and `/admin/reclamaciones/[id]` (full sheet + response) → `PATCH /api/admin/reclamaciones/[id]`
- **Model:** `Complaint` (table `complaints`), enums `ComplaintType` (RECLAMO/QUEJA), `ComplaintGoodType`, `ComplaintStatus`
- **Helpers:** `lib/complaints.ts` — `complaintCode()`, `addBusinessDays()`, `daysUntil()`, `DOCUMENT_TYPES`
- **Emails:** `sendComplaintEmails()` (copy to consumer + internal notice) and `sendComplaintResponse()` in `lib/email.ts`. Internal notice goes to `COMPLAINTS_EMAIL`; without it the consumer still gets their copy but nobody at Adamantio is alerted.

Constraints to preserve:

- **Correlative number** comes from a Postgres `SERIAL` (`Complaint.number`), never from a count — concurrent submissions must not share a number. Display format via `complaintCode()`: `LR-AAAA-NNNNNN`.
- **The copy to the consumer's email is mandatory** for the virtual modality. If Resend fails the sheet is still saved and the API returns `copySent: false`; the UI says so rather than pretending it was sent.
- **Response deadline is 15 días hábiles** (art. 24, as amended by D.L. 1308), extendable by 15 more with prior notice. Not calendar days. Stored in `dueAt`.
- `respondedAt` is set once and never overwritten on later edits — it is the proof the deadline was met.
- Both legal notices must stay visible on the page and in the emails: the deadline, and that filing does not prevent other dispute channels nor is it a prerequisite for an Indecopi complaint.
- Sheets must be kept for at least 2 years, so complaints are persisted, never only emailed.

Free-text consumer fields are interpolated into email HTML — keep using `escapeHtml()` in `lib/email.ts`.

## Deployment

**The app runs on Vercel. Postgres runs on Railway.** `railway.toml` is leftover from when the app itself was on Railway — Vercel ignores it, so its `startCommand` never runs. Do not add deploy steps there expecting them to execute.

**Migrations** are applied by `vercel.json`, and only on production builds:

```json
{
  "buildCommand": "if [ \"$VERCEL_ENV\" = \"production\" ]; then npx prisma migrate deploy; fi && npm run build"
}
```

Preview builds skip `migrate deploy` on purpose: previews share the production database, so an unmerged branch must not alter its schema. If a migration fails, the build fails instead of deploying against a stale schema.

Note this `buildCommand` overrides whatever build command is configured in the Vercel dashboard.

**The database is shared with the POS.** It holds tables this repo's migration history knows nothing about (`CajaSession`, `CajaFondo`, `CajaRetiro`, `StockTransfer`, `media_assets`, extra `Sale` columns). Consequences:

- **Never run `prisma migrate dev` or `migrate reset`** — they detect the drift and offer to reset, which would wipe the POS data.
- To add a schema change locally: edit `prisma/schema.prisma`, hand-write `prisma/migrations/<timestamp>_<name>/migration.sql`, apply it with `npx prisma db execute --file <path>` (note: `db execute` has no `--schema` flag), record it with `npx prisma migrate resolve --applied <timestamp>_<name>`, then `npx prisma generate`.
- Before touching production, run `npx prisma migrate status` against it. Columns applied by hand without being recorded make `migrate deploy` fail with *already exists*; the fix is `migrate resolve --applied` on that one migration, never `--rolled-back` and never editing an applied migration's SQL.

Required environment variables: `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `MP_ACCESS_TOKEN`, `NEXT_PUBLIC_MP_PUBLIC_KEY`, `NEXT_PUBLIC_APP_URL`, `RESEND_API_KEY`, `EMAIL_FROM`, `COMPLAINTS_EMAIL`. Optional per gateway: `IZIPAY_*` (four keys) and `CULQI_PUBLIC_KEY` / `CULQI_SECRET_KEY` — each set is all-or-nothing, and its absence just hides that gateway. See `.env.example` for the full list.

## Hydration Notes

`<body>` has `suppressHydrationWarning` to handle browser extension attribute injection (e.g., `cz-shortcut-listen`). Do not remove it.

`app/auth/login/page.tsx` wraps `LoginForm` in `<Suspense>` because `useSearchParams()` requires a Suspense boundary in Next.js App Router.
