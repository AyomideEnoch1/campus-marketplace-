# CampusTrade: Multi-Vendor Campus Marketplace

A production-ready, mobile-first multi-vendor e-commerce marketplace built specifically for students across multiple university campuses (UNILAG, UI, OAU).

Designed with the modern aesthetics of **NovaTrend** (Hero, value propositions, category grids, dynamic promo banners) and **Forma** (Catalog browsing, horizontal category pills, dual-thumb price filters, condition filters, and student safety trust marks).

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
