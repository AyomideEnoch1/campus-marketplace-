# CampusTrade: Multi-Vendor Campus Marketplace

A production-ready, mobile-first multi-vendor e-commerce marketplace built specifically for students across multiple university campuses (UNILAG, UI, OAU).

Designed with the modern aesthetics of **NovaTrend** (Hero, value propositions, category grids, dynamic promo banners) and **Forma** (Catalog browsing, horizontal category pills, dual-thumb price filters, condition filters, and student safety trust marks).

> 📘 **Payments, Escrow & Disputes Documentation**:  
> For complete architecture details, sequence diagrams, fee structures, 6-digit handover code security, and cron auto-release instructions, see [**docs/PAYMENTS-AND-ESCROW-IMPLEMENTATION.md**](docs/PAYMENTS-AND-ESCROW-IMPLEMENTATION.md).

---

## Secure Payment, Escrow & Payout System (Flutterwave v3)

CampusTrade features a production-grade payment and escrow engine built specifically for Nigerian university campuses, powered by **Flutterwave v3**:

- **Dynamic Value Bands & Risk Overrides**:
  - *Below ₦5,000*: Direct settlement with 0% escrow fee by default.
  - *₦5,000–₦19,999*: Optional toggle between Escrow Protection (1% fee) and Direct Settlement (0% fee).
  - *₦20,000 and Above*: Mandatory Escrow Protection (2% fee).
  - *Mandatory Overrides*: Escrow is strictly enforced regardless of amount for off-campus Guest Vendors, sellers with safety strikes, high-risk product categories (Electronics, Cosmetics, Campus Meals), and suspicious order-splitting patterns.
- **Transparent Fee Structure**:
  - 5% marketplace commission across all tiers, strictly deducted from vendor proceeds (never added to buyer total).
  - Full financial transparency during checkout: product subtotal, escrow protection fee, total payable, platform commission, and expected net seller payout.
- **Physical Handover Verification**:
  - Cryptographically secure 6-digit one-time handover codes generated upon payment verification and encrypted with AES-256-GCM.
  - Stored as `sha256Hash|aesEncryptedPayload`. Only the authenticated buyer can view their code.
  - Vendors verify the code in person at university safe meetup points via a dedicated interface protected by a **5-attempt brute-force lockout**.
- **Inviolable 48-Hour Inspection Window**:
  - Starts strictly upon verified physical handover (`delivered_at`).
  - Student vendors: 48-hour payout eligibility.
  - Guest vendors: 72-hour payout eligibility.
  - Buyers can open an active dispute during this window, which immediately freezes automatic payout release.
- **Double Payout Prevention & Balanced Ledger**:
  - Immutable append-only `escrow_ledger` records every transaction (`escrow_in`, `commission`, `escrow_out`, `refund_out`, `adjustment`).
  - Automated cron release endpoint (`/api/escrow/cron-auto-release`) protected by `CRON_SECRET` verifies actual Flutterwave merchant balance before executing payouts.
- **Automated Test Suite**:
  - Comprehensive 93-assertion test suite in `scripts/test-escrow-flow.ts` covering eligibility, webhooks, crypto, lockout, timing, disputes, ledger balance equations, and concurrency.

For complete technical documentation, see [**docs/PAYMENTS-AND-ESCROW-IMPLEMENTATION.md**](docs/PAYMENTS-AND-ESCROW-IMPLEMENTATION.md).

---

## Tech Stack

| Layer | Choice |
|---|---|
| **Framework** | Next.js 14 (App Router) + TypeScript |
| **Styling** | Tailwind CSS + shadcn/ui design language |
| **Database** | PostgreSQL (Supabase) + SQLite local development mode |
| **ORM** | Prisma |
| **Auth** | Session-based JWT + HTTP-only cookies, Supabase Auth integration |
| **Storage** | Supabase Storage (product photos & student ID uploads) |
| **Validation**| Zod + React Hook Form |

---

## Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Database Setup & Seeding

#### Option A: Immediate Zero-Config Local SQLite (Pre-configured)
The project comes with a seeded database (`prisma/dev.db`) containing:
- 1 Super Admin account
- 3 Campuses (UNILAG Akoka, UI Ibadan, OAU Ile-Ife)
- 8 Primary Categories + Subcategories
- 5 Verified Student Vendors with storefronts
- 20 Realistic Sample Products with pricing in ₦ (NGN), tags, and conditions

To re-seed or push schema changes anytime:
```bash
npm run db:sqlite
```

#### Option B: Supabase PostgreSQL (Production)
1. Copy `.env.example` to `.env` and paste your Supabase connection strings:
```bash
DATABASE_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[REF]:[PASS]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```
2. Run Prisma push & seed:
```bash
npm run db:postgres
```

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Seed Accounts for Manual Testing

For effortless testing, the sign-in page (`/auth/login`) includes **1-Click credential filling pills**:

| Role | Email | Password | Access / Capabilities |
|---|---|---|---|
| **Super Admin** | `admin@campustrade.ng` | `AdminPassword123!` | Full control of Admin CMS (`/admin`), vendor approvals, and product moderation |
| **Student Vendor (UNILAG)** | `kicks@unilag.ng` | `VendorPassword123!` | Unilag Kicks & Apparel store |
| **Student Vendor (UI)** | `techhub@ui.ng` | `VendorPassword123!` | Ibadan Tech Point store |
| **Student Vendor (OAU)** | `vintage@oau.ng` | `VendorPassword123!` | OAU Thrift & Vintage Boutique |
| **Student Vendor (UNILAG)**| `hostelmart@unilag.ng`| `VendorPassword123!` | Hostel Living Essentials Mart |
| **Student Vendor (UI)** | `academics@ui.ng` | `VendorPassword123!` | Campus Book Den & Stationary |

---

## Key Pages & Routes Built

### Public Marketplace
- **Homepage (`/`)**: Built matching the **NovaTrend** reference layout with hero, floating live product badges, social proof counter, category grid, new arrivals, flash sale timer banner, and student vendor spotlight.
- **Shop / Marketplace (`/shop`)**: Built matching the **Forma** reference layout with sticky horizontal category pill slider, left-hand sidebar filters (Campus, Category, Condition, Price range, and Student Vendors), sort options, and responsive product cards with price, badges, and direct WhatsApp contact.
- **Product Details (`/product/[slug]`)**: Rich interactive product page with multi-photo zoom gallery, optional interactive Google 3D viewer (`<model-viewer>`), pricing in ₦ with discount savings, condition badge, stock indicator, quantity stepper, verified vendor card, and direct WhatsApp chat.
- **Campus Order Bag (`/cart`)**: Vendor-segregated cart where items are clearly grouped by student seller with subtotal calculations per vendor.
- **Order Request Checkout (`/checkout`)**: Frictionless on-campus checkout capturing student name, phone, campus pickup hub or hostel delivery address, and notes.
- **Order Success Page (`/order-success/[orderNumber]`)**: Order confirmation with an instant 1-click button to chat the seller on WhatsApp with prefilled order details.
- **Campuses Directory (`/campuses`)**: Interactive university hub with campus filtering for UNILAG, UI, and OAU.
- **Student Vendors (`/vendors`)**: Verified student business directory.
- **Vendor Storefronts (`/store/[slug]`)**: Dynamic student vendor storefront rendering their chosen layout (**Grid**, **List**, **Showcase**, or **Lookbook**) along with their custom brand color, banner, logo, and verified campus badge.

### Student Vendor Portal (`/dashboard`)
- **Overview Dashboard (`/dashboard`)**: Metric cards for total products, impressions/views, order requests, and current active layout.
- **Product Inventory (`/dashboard/products`)**: Table with search, status filter pills (`ALL`, `PUBLISHED`, `DRAFT`, `HIDDEN`), stock counts, views, and instant edit/delete actions.
- **Product CRUD (`/dashboard/products/new` & `[id]/edit`)**: Title, description, price (NGN), compare-at price, categories, stock, condition (`NEW`, `USED_LIKE_NEW`, etc.), multiple image URLs, optional 3D model (.glb) URL, and published/draft status.
- **Store Customizer (`/dashboard/customize`)**: Switch between the **4 layouts in real time** with interactive live preview, brand color picker with campus presets, logo, banner, and WhatsApp order settings.
- **Order Requests (`/dashboard/orders`)**: View incoming student orders, buyer pickup/delivery details, 1-click WhatsApp customer contact, and status updates (`CONFIRMED`, `DELIVERED`, `CANCELLED`).

### Admin CMS (`/admin`)
- **Admin CMS Login (`/admin/login`)**: Protected administrative authentication.
- **Admin CMS Dashboard (`/admin`)**: Metric cards (Vendors, Products, Campuses, Orders), pending vendor approvals, recent product submissions.
- **Vendor Moderation (`/admin/vendors`)**: Interactive approval management table where admins can search, filter by campus/status, approve, suspend, or reject vendors in real-time.
