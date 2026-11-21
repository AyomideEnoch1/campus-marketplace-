# CampusTrade: Flutterwave Payments, Escrow & Payout System Documentation

> **Status:** Production-Engineered & Verified (Phases 1–5 Complete)  
> **Test Coverage:** 93 automated assertions passing (0 failures) across eligibility, cryptography, lockout, inspection timing, disputes, ledger mathematics, and concurrency.  
> **Last Updated:** 2026-11-20

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Architecture Explanation](#2-architecture-explanation)
3. [Mermaid Architecture Diagram](#3-mermaid-architecture-diagram)
4. [Database Models and Relationships](#4-database-models-and-relationships)
5. [Payment Initialization Flow](#5-payment-initialization-flow)
6. [Payment Verification Flow](#6-payment-verification-flow)
7. [Flutterwave Webhook Processing](#7-flutterwave-webhook-processing)
8. [Escrow Eligibility Rules & Value Bands](#8-escrow-eligibility-rules--value-bands)
9. [Fee and Commission Calculations with Realistic Examples](#9-fee-and-commission-calculations-with-realistic-examples)
10. [Handover Code Generation and Verification](#10-handover-code-generation-and-verification)
11. [The 48-Hour Inspection Window](#11-the-48-hour-inspection-window)
12. [Student and Guest Vendor Payout Timing](#12-student-and-guest-vendor-payout-timing)
13. [Dispute Lifecycle & State Diagram](#13-dispute-lifecycle--state-diagram)
14. [Refund Processing](#14-refund-processing)
15. [Seller Payout Lifecycle](#15-seller-payout-lifecycle)
16. [Financial Ledger and Reconciliation](#16-financial-ledger-and-reconciliation)
17. [Admin Financial Operations](#17-admin-financial-operations)
18. [API Endpoint Reference](#18-api-endpoint-reference)
19. [Request and Response Examples](#19-request-and-response-examples)
20. [Authentication and Authorization Rules](#20-authentication-and-authorization-rules)
21. [Environment Setup](#21-environment-setup)
22. [Supabase & PostgreSQL Configuration](#22-supabase--postgresql-configuration)
23. [Prisma Setup and Migration Commands](#23-prisma-setup-and-migration-commands)
24. [Local Development Instructions](#24-local-development-instructions)
25. [Flutterwave Test-Mode Configuration](#25-flutterwave-test-mode-configuration)
26. [Webhook Configuration](#26-webhook-configuration)
27. [Cron & Background Job Configuration](#27-cron--background-job-configuration)
28. [Automated Testing Instructions](#28-automated-testing-instructions)
29. [Troubleshooting Guide](#29-troubleshooting-guide)
30. [Production Deployment Checklist](#30-production-deployment-checklist)
31. [Flutterwave & Escrow Compliance Limitations](#31-flutterwave--escrow-compliance-limitations)

---

## 1. System Overview

CampusTrade is a multi-campus e-commerce marketplace built for Nigerian university environments (UNILAG, UI, OAU). It bridges the trust gap between student buyers and sellers through an automated payment, verification, and payout engine powered by **Flutterwave v3**.

### Core Problem Solved
Traditional on-campus commerce relies on cash or direct mobile transfers:
- **Advance payments** expose buyers to non-delivery, damaged goods, or misrepresentation.
- **Pay-on-delivery** exposes student sellers to fraud, counterfeit currency, or physical safety risks.
- **Off-campus guest vendors** pose a heightened risk to on-campus students without formal university affiliations.

### How CampusTrade Solves This
1. **Upfront Payment Holding**: Buyers fund orders upfront via Flutterwave (Cards, Bank Transfer, USSD).
2. **Designated Safe Meetup Points**: Orders are fulfilled at official university-designated safe meeting points.
3. **Cryptographic 6-Digit Handover Verification**: A one-time 6-digit code is generated and visible only to the buyer. Handover is confirmed when the seller inputs this code in person.
4. **Inviolable 48-Hour Inspection Window**: Handover starts a 48-hour countdown during which the buyer can open a dispute if goods are defective or not as described.
5. **Programmatic Settlement**: Once the inspection window passes without dispute, funds are disbursed directly to the vendor's verified Nigerian commercial or digital bank account.

---

## 2. Architecture Explanation

The payment system follows a layered, modular architecture:
- **Presentation Layer (Next.js 14 App Router)**: Client components handle dynamic quote fetching, optional escrow toggling, 6-digit code displays, live countdown timers, and vendor code verification modals.
- **API & Orchestration Layer (Server Routes)**: Next.js route handlers validate inputs, authenticate caller sessions, enforce business rules, and interface with the database using Prisma transactions.
- **Core Rules & Mathematics Engine (`src/lib/payments/escrow-rules.ts`)**: Pure arithmetic functions operating in integer kobo to eliminate floating-point drift. Determines escrow mode, fee bands, and evaluates 7 distinct mandatory overrides.
- **Payout & Inspection Engine (`src/lib/escrow.ts`)**: Calculates effective payout eligibility using `max(handover + 48h, handover + sellerDelay)` and enforces dispute freezes.
- **Cryptography Vault (`src/lib/crypto.ts`)**: Generates cryptographically secure 6-digit codes, encrypts them using AES-256-GCM, and hashes them using SHA-256.
- **Provider Abstraction (`src/lib/payments/flutterwave.ts`)**: Isolates all external communication with Flutterwave's REST API. Supports an offline mock mode for continuous integration and unit testing.
- **Persistence Layer (`prisma/schema.prisma`)**: Relational database storing orders, immutable append-only escrow ledger entries, payout retry queues, hashed delivery codes, and dispute records.

---

## 3. Mermaid Architecture Diagram

```mermaid
flowchart TD
    subgraph Client["Client Application (Next.js 14)"]
        Checkout["Buyer Checkout (/checkout)"]
        OrderTrack["Order Tracking (/orders/[id])"]
        VendorDash["Vendor Orders (/dashboard/orders)"]
        AdminEscrow["Admin Console (/admin/escrow)"]
    end

    subgraph API["Backend API Layer"]
        QuoteAPI["/api/payments/checkout-quote"]
        CreatePayAPI["/api/payments/create-payment"]
        VerifyPayAPI["/api/payments/verify-payment"]
        WebhookAPI["/api/payments/webhook"]
        VerifyCodeAPI["/api/escrow/verify-delivery-code"]
        CronReleaseAPI["/api/escrow/cron-auto-release"]
        DisputeAPI["/api/disputes/open & /respond & /resolve"]
    end

    subgraph Core["Core Business & Security Modules"]
        RulesEngine["Rules & Fee Engine (escrow-rules.ts)"]
        TimingEngine["Inspection Timing Engine (escrow.ts)"]
        CryptoVault["Crypto & Lockout Vault (crypto.ts)"]
        FlwWrapper["Flutterwave v3 Client (flutterwave.ts)"]
    end

    subgraph Database["Prisma PostgreSQL Database"]
        OrdersTbl[("orders")]
        LedgerTbl[("escrow_ledger")]
        CodesTbl[("delivery_codes")]
        PayoutsTbl[("payouts")]
        DisputesTbl[("disputes")]
        WebhooksTbl[("webhook_events")]
    end

    subgraph Flutterwave["Flutterwave Payment Gateway"]
        FlwStandard["Hosted Checkout (/v3/payments)"]
        FlwVerify["Verify Transaction (/v3/transactions/{id}/verify)"]
        FlwTransfers["Transfers API (/v3/transfers)"]
        FlwBalance["Merchant Balance (/v3/balances)"]
    end

    Checkout -->|Fetch Quote| QuoteAPI
    QuoteAPI --> RulesEngine
    Checkout -->|Initiate Order| CreatePayAPI
    CreatePayAPI --> FlwWrapper
    FlwWrapper --> FlwStandard
    FlwStandard -->|Callback / Redirect| VerifyPayAPI
    VerifyPayAPI --> FlwVerify
    VerifyPayAPI -->|Create Code & Ledger| Database
    OrderTrack -->|Fetch Code| CryptoVault
    VendorDash -->|Submit 6-Digit Code| VerifyCodeAPI
    VerifyCodeAPI --> CryptoVault
    VerifyCodeAPI -->|Stamp delivered_at| OrdersTbl
    CronReleaseAPI --> TimingEngine
    CronReleaseAPI --> FlwBalance
    CronReleaseAPI --> FlwTransfers
    DisputeAPI -->|Freeze Escrow| OrdersTbl
```

---

## 4. Database Models and Relationships

```mermaid
erDiagram
    ORDER ||--o| DELIVERY_CODE : "has one"
    ORDER ||--o| DISPUTE : "has one"
    ORDER ||--o{ PAYOUT : "has many"
    ORDER ||--o{ PAYMENT : "has many"
    ORDER ||--o{ ESCROW_LEDGER : "has many"
    DISPUTE ||--o{ REFUND : "generates"
    VENDOR_PROFILE ||--o{ ORDER : "fulfills"
    VENDOR_PROFILE ||--o| SELLER_BANK_ACCOUNT : "settles to"

    ORDER {
        string id PK
        string orderNumber UK
        string tx_ref UK
        string escrow_mode "escrow | direct"
        string escrow_status "pending | paid_held | confirmed | delivered | disputed | payout_pending | released | refunded"
        float totalAmount
        float subtotal
        float commission
        float seller_amount
        float fee_amount
        datetime delivered_at
        datetime dispute_deadline
        datetime paid_at
        datetime released_at
    }

    DELIVERY_CODE {
        string id PK
        string orderId FK,UK
        string codeHash "sha256Hash|aesEncryptedPayload"
        int attempts "max 5"
        boolean locked
        datetime expiresAt
    }

    ESCROW_LEDGER {
        string id PK
        string orderId FK
        string type "escrow_in | commission | escrow_out | refund_out | adjustment"
        float amount
        string currency
        string reference UK
        string description
        datetime createdAt
    }

    PAYOUT {
        string id PK
        string orderId FK
        string sellerId FK
        float amount
        string reference UK
        string status "pending | processing | successful | failed | reversed"
        int attempts
        datetime nextRetryAt
        datetime completedAt
    }

    DISPUTE {
        string id PK
        string orderId FK,UK
        string buyerId FK
        string reason
        string description
        string evidencePaths "JSON structure"
        string status "open | under_review | resolved_refund | resolved_release | resolved_split"
        float refundAmount
        float sellerReleaseAmount
        datetime resolvedAt
    }
```

---

## 5. Payment Initialization Flow

1. **Buyer Form Submission**: Buyer reviews checkout details and clicks "Pay Securely via Escrow" or "Pay Directly".
2. **Server-Side Price Validation**: `POST /api/payments/create-payment` fetches real product records directly from the database to guarantee prices are never trusted from the client.
3. **Escrow Mode & Fee Revalidation**: Calls `evaluateEscrowOrder()` to enforce value bands and risk overrides.
4. **Order Record Creation**: Creates an `Order` row in `pending` state with snapshots of `escrow_mode`, `fee_amount`, `subtotal`, and `totalAmount`.
5. **Flutterwave Payment Link**: Calls Flutterwave `POST /v3/payments` with `tx_ref`, `amount` (`buyerTotalNaira`), and customer details.
6. **Hosted Checkout Redirect**: Returns the `paymentLink` URL to the browser for payment processing.

---

## 6. Payment Verification Flow

1. **Post-Payment Return**: Flutterwave redirects the user to `/checkout/confirm?tx_ref=...&transaction_id=...`.
2. **Strict Server-Side Verification**: The frontend calls `GET /api/payments/verify-payment`. The backend queries Flutterwave's `GET /v3/transactions/{id}/verify` endpoint directly.
3. **Amount & Currency Validation**:
   - Asserts `status === "successful"`.
   - Asserts currency is strictly `"NGN"`.
   - Asserts paid amount matches `order.totalAmount` within ₦0.01 tolerance.
4. **Atomic State Transition**: Within a Prisma database transaction:
   - Order status updates to `escrow_status: "paid_held"`, `status: "CONFIRMED"`.
   - Generates and encrypts the 6-digit delivery code (`sha256Hash|aesEncryptedPayload`).
   - Appends `escrow_in` ledger entry for `order.totalAmount`.
   - Appends `commission` ledger entry for 5% marketplace commission.
   - Decrements product inventory stock.

---

## 7. Flutterwave Webhook Processing

- **Endpoint**: `POST /api/payments/webhook`
- **Signature Verification**: Validates the `verif-hash` header against `FLW_SECRET_HASH`. Requests with invalid or missing headers are rejected with HTTP 401.
- **Idempotency**: Checked against the `webhook_events` table using `eventId`. Duplicate deliveries return HTTP 200 without reprocessing.
- **Event Dispatcher**:
  - `charge.completed`: Invokes `verifyOrderPayment()` to verify payment with Flutterwave API.
  - `transfer.completed`: Marks the payout as `successful`, sets order `escrow_status: "released"`.
  - `transfer.failed`: Marks the payout as `failed`, records failure reason, schedules exponential backoff retry.
  - `transfer.reversed`: Sets payout status to `reversed`, appends an `adjustment` ledger entry.

---

## 8. Escrow Eligibility Rules & Value Bands

| Band / Scenario | Subtotal Range | Escrow Mode | Escrow Fee | Marketplace Commission | Toggleable |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Micro Transactions** | Below ₦5,000 | Direct | 0% (₦0) | 5% (deducted from seller) | No |
| **Standard Transactions** | ₦5,000–₦19,999 | Escrow (Default) | 1% (capped at ₦5,000) | 5% (deducted from seller) | Yes (established buyers) |
| **High-Value Transactions** | ₦20,000 and Above | Escrow (Mandatory) | 2% (capped at ₦5,000) | 5% (deducted from seller) | No |

### Mandatory Escrow Overrides (Regardless of Price)
1. **Guest Vendors**: Off-campus guest vendors mandate escrow on all orders, even sub-₦5,000.
2. **Tier Verification**: Student vendors below Tier 4 trusted seller status mandate escrow.
3. **Disciplinary History**: Vendors with active strikes or complaints mandate escrow.
4. **New Vendors**: Vendors registered within the last 30 days mandate escrow.
5. **New Buyers**: First-time buyers mandate escrow on orders of ₦5,000 and above.
6. **Restricted Categories**: Electronics, food/groceries, and cosmetics mandate escrow.
7. **Order-Splitting Detection**: Cumulative purchases between the same buyer and seller exceeding ₦5,000 or multiple rapid transactions within 24 hours mandate escrow.

---

## 9. Fee and Commission Calculations with Realistic Examples

All calculations operate in integer kobo using standard 5% platform commission deducted from seller proceeds:

### Example 1: Used Textbook (Micro Transaction)
- **Product Subtotal**: ₦3,500
- **Escrow Service Fee (0%)**: ₦0
- **Total Payable by Buyer**: ₦3,500
- **Platform Commission (5%)**: ₦175 (₦3,500 × 0.05)
- **Seller Net Payout**: ₦3,325 (₦3,500 - ₦175)

### Example 2: Scientific Calculator (Standard Transaction with Escrow)
- **Product Subtotal**: ₦10,000
- **Escrow Service Fee (1%)**: ₦100 (₦10,000 × 0.01)
- **Total Payable by Buyer**: ₦10,100 (₦10,000 + ₦100)
- **Platform Commission (5%)**: ₦500 (₦10,000 × 0.05)
- **Seller Net Payout**: ₦9,500 (₦10,000 - ₦500)

### Example 3: Laptop / Smartphone (High-Value Mandatory Escrow)
- **Product Subtotal**: ₦50,000
- **Escrow Service Fee (2%)**: ₦1,000 (₦50,000 × 0.02)
- **Total Payable by Buyer**: ₦51,000 (₦50,000 + ₦1,000)
- **Platform Commission (5%)**: ₦2,500 (₦50,000 × 0.05)
- **Seller Net Payout**: ₦47,500 (₦50,000 - ₦2,500)

---

## 10. Handover Code Generation and Verification

### Cryptographic Security Model
1. **Random Code**: Generated via `crypto.randomInt(100000, 999999)` producing a 6-digit integer string.
2. **SHA-256 Hash**: Hashed for fast constant-time verification.
3. **AES-256-GCM Encryption**: Encrypted with an initialization vector (IV) and authentication tag so that only the authenticated buyer can retrieve and decrypt their code.
4. **Storage**: Stored in `delivery_codes.code_hash` as `${sha256Hash}|${iv}:${tag}:${encryptedHex}`.

### Verification & 5-Attempt Lockout
- The seller submits the buyer's code via `POST /api/escrow/verify-delivery-code`.
- The system increments `delivery_codes.attempts`.
- If `attempts >= 5` and code is incorrect, `locked: true` is set permanently.
- All subsequent verification attempts are rejected with HTTP 403 until administrative review.
- On successful verification: `order.delivered_at` is stamped, `order.status` becomes `DELIVERED`, and `dispute_deadline` is set to `delivered_at + 48 hours`.

---

## 11. The 48-Hour Inspection Window

- **Start Time**: Measured from the exact verified handover timestamp (`delivered_at`).
- **Duration**: Exactly 48 hours (`delivered_at + 172,800,000 ms`).
- **Countdown Display**: Visible to the buyer on `/orders/[id]` and the seller on `/dashboard/orders`.
- **Automatic Release Protection**: Automatic release cannot execute before the full 48 hours have elapsed.
- **Dispute Freeze Guarantee**: If a dispute is opened during this window, automatic payout release is strictly frozen.

---

## 12. Student and Guest Vendor Payout Timing

The effective payout release deadline is governed by:

$$\text{effectivePayoutTime} = \max(\text{handover} + 48\text{h [inspection]}, \text{handover} + \text{sellerDelay})$$

- **Student Vendors**: 48-hour seller payout delay. Effective eligibility: 48 hours post-handover.
- **Off-Campus Guest Vendors**: 72-hour seller payout delay. Effective eligibility: 72 hours post-handover.
- **Trusted Seller Status**: The 48-hour buyer inspection period is inviolable and cannot be shortened under any circumstances.

---

## 13. Dispute Lifecycle & State Diagram

```mermaid
stateDiagram-v2
    [*] --> PendingPayment
    PendingPayment --> PaidHeld : Flutterwave Payment Verified
    PaidHeld --> Delivered : 6-Digit Code Verified at Handover
    PaidHeld --> Disputed : Vendor No-Show Reported
    Delivered --> Disputed : Buyer Opens Dispute (within 48h)
    Delivered --> PayoutPending : 48h Inspection Concluded (No Dispute)
    Disputed --> UnderReview : Seller Responds with Evidence
    UnderReview --> ResolvedRefund : Admin Orders Buyer Refund
    UnderReview --> ResolvedRelease : Admin Orders Seller Release
    UnderReview --> ResolvedSplit : Admin Orders Partial Split
    ResolvedRefund --> Refunded : Full Refund Credited
    ResolvedRelease --> Released : Payout Transferred
    ResolvedSplit --> Released : Split Transferred & Refunded
    PayoutPending --> Released : Bank Transfer Successful
```

### Dispute Endpoints:
- `POST /api/disputes/open`: Buyer opens a dispute (defective, not as described, or vendor no-show).
- `POST /api/disputes/[id]/respond`: Seller submits their explanation and counter-evidence. Transitions dispute status to `under_review`.
- `POST /api/disputes/resolve`: Admin resolves dispute via `refund`, `release`, or `split`.

---

## 14. Refund Processing

When an admin resolves a dispute in the buyer's favor (`resolution: "refund"`):
1. **Provider Refund**: Initiates refund via Flutterwave `POST /v3/transactions/{id}/refund`.
2. **Order Cancellation**: Sets `order.status: "CANCELLED"`, `escrow_status: "refunded"`.
3. **Refund Record**: Inserts a row in the `refunds` table with `flwRefundId`.
4. **Ledger Accounting**: Appends an immutable `refund_out` entry to `escrow_ledger`.

---

## 15. Seller Payout Lifecycle

1. **Eligibility Evaluation**: Auto-release cron verifies that `delivered_at` exists, 48 hours have elapsed, seller delay is satisfied, and no dispute is active.
2. **Merchant Balance Check**: Verifies that Flutterwave available balance covers the seller payout amount.
3. **Atomic State Lock**: Order transitions to `payout_pending`, creating a pending `payouts` record and appending an `escrow_out` ledger entry.
4. **Flutterwave Transfers API**: Calls `POST /v3/transfers` with verified bank details and unique reference `payout_{orderId}_{attempt}`.
5. **Success / Failure Handling**:
   - `successful`: Order marked `released`, notification sent to vendor.
   - `failed`: Payout marked `failed`, failure reason recorded, next retry scheduled with exponential backoff ($2^{\text{attempt}}$ hours, max 24h).

---

## 16. Financial Ledger and Reconciliation

CampusTrade utilizes an append-only ledger (`escrow_ledger`). Rows are never updated or deleted.

### Fundamental Accounting Equation:
$$\sum \text{escrow\_in} = \sum \text{escrow\_out} + \sum \text{refund\_out} + \text{active\_escrow\_held}$$

- **`escrow_in`**: Inflow when buyer payment is verified.
- **`commission`**: 5% platform marketplace revenue record.
- **`escrow_out`**: Outflow when funds are disbursed to vendor.
- **`refund_out`**: Outflow when funds are refunded to buyer.
- **`adjustment`**: Reversal record if a payout transfer is reversed by recipient bank.

---

## 17. Admin Financial Operations

The Admin Escrow Console is located at `/admin/escrow` (API: `GET /api/admin/escrow`):
- **Live Merchant Balance Reconciliation**: Queries Flutterwave `GET /v3/balances/NGN` and audits against `active_escrow_held`. Displays deficit warnings if merchant balance drops below logical escrow liabilities.
- **Failed Payouts Queue**: Displays failed transfers with failure reasons and provides a 1-click retry button.
- **Dispute Resolution Console**: View active disputes, review buyer/seller evidence, and execute 1-click full refunds, seller releases, or custom percentage splits.
- **Audit Logs**: Real-time trail of administrative actions, forced releases, and dispute settlements.

---

## 18. API Endpoint Reference

| Method | Endpoint | Purpose | Auth | Request Key Fields | Possible Errors |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/payments/checkout-quote` | Calculate prices, eligibility & fees | Optional | `items`, `buyerWantsDirect` | 400 (no items), 404 (product not found) |
| `POST` | `/api/payments/create-payment` | Initialize Flutterwave checkout | Optional | `items`, `buyerName`, `buyerEmail`, `vendorId` | 400 (validation), 500 (provider error) |
| `GET` | `/api/payments/verify-payment` | Verify payment status from callback | Public | `tx_ref`, `transaction_id` | 400 (amount/currency mismatch), 404 (not found) |
| `POST` | `/api/payments/webhook` | Process Flutterwave webhook events | Webhook Hash | Raw webhook payload | 401 (invalid verif-hash), 200 (idempotent duplicate) |
| `GET` | `/api/escrow/delivery-code` | Retrieve buyer's 6-digit code | Buyer | `orderId` (query param) | 401 (unauthorized), 403 (not order buyer) |
| `POST` | `/api/escrow/verify-delivery-code` | Vendor verifies 6-digit code | Vendor | `orderId`, `deliveryCode` | 400 (incorrect code), 403 (locked 5 attempts) |
| `POST` | `/api/escrow/release-funds` | Execute payout release to vendor | Vendor/Admin | `orderId`, `forceAdminRelease` | 400 (inspection running / dispute), 503 (low balance) |
| `POST` | `/api/escrow/cron-auto-release` | Automated cron release of eligible orders | CRON_SECRET | Bearer Token in Authorization header | 401 (unauthorized secret) |
| `POST` | `/api/disputes/open` | Open dispute within 48h inspection | Buyer | `orderId`, `reason`, `description` | 400 (window expired / already disputed) |
| `POST` | `/api/disputes/[id]/respond` | Seller responds to dispute | Seller/Admin | `responseText`, `evidenceUrls` | 400 (already resolved), 403 (unauthorized) |
| `POST` | `/api/disputes/resolve` | Admin dispute resolution | Admin | `disputeId`, `resolution`, `refundAmount` | 400 (invalid resolution), 403 (non-admin) |
| `GET` | `/api/admin/escrow` | Admin ledger metrics & balances | Admin | None | 403 (non-admin) |
| `GET` | `/api/vendor/bank/list` | List Nigerian commercial & digital banks | Public | None | 500 (provider error) |
| `POST` | `/api/vendor/bank/resolve` | Resolve Nigerian account number | Authenticated | `bankCode`, `accountNumber` | 400 (invalid format), 500 (resolution failed) |

---

## 19. Request and Response Examples

### Example: Checkout Quote Request
```http
POST /api/payments/checkout-quote
Content-Type: application/json

{
  "items": [
    { "productId": "prod_cm12345", "quantity": 1 }
  ],
  "buyerWantsDirect": false
}
```

### Example: Checkout Quote Response
```json
{
  "success": true,
  "quote": {
    "escrow_mode": "escrow",
    "canToggle": true,
    "isForced": false,
    "forcedReason": null,
    "thresholdCategory": "5k_to_20k",
    "subtotal": 10000,
    "feeAmount": 100,
    "feePercent": 1,
    "feePayer": "buyer",
    "buyerTotal": 10100,
    "sellerAmount": 9500,
    "commission": 500,
    "kobo": {
      "subtotal": 1000000,
      "fee": 10000,
      "buyerTotal": 1010000
    }
  }
}
```

---

## 20. Authentication and Authorization Rules

- **Buyer Ownership**: Only the authenticated buyer whose `session.id === order.buyerId` or matching `buyerEmail` can view their 6-digit delivery code or open a dispute.
- **Vendor Ownership**: Only the vendor assigned to an order can verify the handover delivery code or update fulfillment status.
- **Admin Privilege**: All dispute resolutions (`POST /api/disputes/resolve`) and financial audits (`GET /api/admin/escrow`) strictly require `(session as any).role === "ADMIN"`. Non-admin sessions receive HTTP 403.
- **Cron Authentication**: The automated auto-release cron endpoint requires `Authorization: Bearer <CRON_SECRET>` or `x-cron-secret: <CRON_SECRET>`.

---

## 21. Environment Setup

Copy `.env.example` to `.env` and configure with your credentials:

```env
# Database Connections
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# JWT Secret
JWT_SECRET="your-32-char-random-jwt-secret-key"

# App URL
NEXT_PUBLIC_APP_URL="http://localhost:3000"

# Flutterwave v3 API Credentials
FLW_PUBLIC_KEY="FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxx-X"
FLW_SECRET_KEY="FLWSECK_TEST-xxxxxxxxxxxxxxxxxxxx-X"
FLW_ENCRYPTION_KEY="FLWSECK_TESTxxxxxxxx"
FLW_SECRET_HASH="your_chosen_webhook_secret_hash"

# Development Offline Mock Mode (true enables offline test suite)
MOCK_FLUTTERWAVE="false"

# Background Job Secret
CRON_SECRET="your-secure-random-cron-secret-min-32-chars"
```

---

## 22. Supabase & PostgreSQL Configuration

1. In Supabase Dashboard -> Project Settings -> Database:
   - Copy the **Connection Pooling** URL (port 6543) into `DATABASE_URL`.
   - Copy the **Direct Connection** URL (port 5432) into `DIRECT_URL`.
2. Supabase Storage buckets configured:
   - `products`: Public bucket for product images.
   - `vendor-documents`: Private bucket for student ID card verification.

---

## 23. Prisma Setup and Migration Commands

```bash
# Validate schema integrity
npx prisma validate --schema=prisma/schema.prisma

# Generate Prisma Client for PostgreSQL
npm run prisma:generate:pg

# Push schema directly to database
npm run db:postgres

# Run database seeds
npm run prisma:seed
```

---

## 24. Local Development Instructions

### Option A: Offline SQLite Development (Zero Config)
```bash
npm run db:sqlite
npm run dev
```

### Option B: PostgreSQL Development (Production Parity)
```bash
npm run db:postgres
npm run dev
```

---

## 25. Flutterwave Test-Mode Configuration

1. Register at [dashboard.flutterwave.com](https://dashboard.flutterwave.com).
2. Switch toggle to **Test Mode**.
3. Copy your `FLWPUBK_TEST` and `FLWSECK_TEST` keys into `.env`.
4. Use standard Flutterwave test cards (e.g. `CARD_SUCCESS`, PIN `3310`, OTP `12345`).

---

## 26. Webhook Configuration

1. In Flutterwave Dashboard -> Settings -> Webhooks:
   - Set **Webhook URL** to: `https://your-domain.com/api/payments/webhook`
   - Set **Secret Hash** to match your `FLW_SECRET_HASH` in `.env`.
2. Check the boxes for:
   - `charge.completed`
   - `transfer.completed`
   - `transfer.failed`
   - `transfer.reversed`

---

## 27. Cron & Background Job Configuration

To trigger automatic release every 30 minutes, configure an HTTP cron job:

### Vercel Cron (`vercel.json`)
```json
{
  "crons": [
    {
      "path": "/api/escrow/cron-auto-release",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

### GitHub Actions / External Cron Curl:
```bash
curl -X POST https://your-domain.com/api/escrow/cron-auto-release \
  -H "Authorization: Bearer your-secure-random-cron-secret-min-32-chars"
```

---

## 28. Automated Testing Instructions

Run the 93-assertion test suite:

```bash
npx tsx scripts/test-escrow-flow.ts
```

Output:
```
=======================================================
TEST SUMMARY: 93 PASSED, 0 FAILED
=======================================================
```

---

## 29. Troubleshooting Guide

- **`Amount mismatch error on verify-payment`**: Ensure `order.totalAmount` is billed to Flutterwave (including the escrow fee) rather than base subtotal.
- **`Verification locked (5 attempts)`**: The delivery code was incorrectly entered 5 times. An admin must review the order in `/admin/escrow` to unlock or mediate.
- **`Insufficient available balance (HTTP 503)`**: Payout was paused because the platform's Flutterwave available balance is lower than the seller payout. Fund the Flutterwave merchant account.
- **`Webhook returns 401`**: Verify that the `verif-hash` header sent by Flutterwave matches `FLW_SECRET_HASH` exactly.

---

## 30. Production Deployment Checklist

- [x] Prisma Client generated for PostgreSQL schema (`prisma/schema.prisma`).
- [x] TypeScript builds cleanly with zero errors (`npx tsc --noEmit`).
- [x] Next.js production build succeeds (`npm run build`).
- [x] All 93 automated test assertions pass (`scripts/test-escrow-flow.ts`).
- [x] `CRON_SECRET` configured with a minimum of 32 random characters.
- [x] `FLW_SECRET_HASH` configured on both Flutterwave dashboard and `.env`.
- [x] Safe meetup points populated for all participating campuses.
- [x] Dedicated admin accounts seeded with secure credentials.

---

## 31. Flutterwave & Escrow Compliance Limitations

> [!WARNING]
> ### Critical Regulatory & Custodial Notice
> **Logical Ledger Holding vs. Genuine Trust Escrow**:
> Under current Flutterwave operational mechanics in Nigeria, funds collected from buyers settle directly into **CampusTrade's merchant bank balance**. The platform records these funds as logically "held" in the database ledger (`escrow_ledger`).
> 
> A database record **does not physically isolate or restrict access to settled funds**.
> 
> Therefore:
> 1. CampusTrade must **NOT** advertise or present this service as a "regulated third-party trustee escrow" or "licensed banking escrow".
> 2. It must be accurately described to students and vendors as a **"Campus Marketplace Buyer-Protection Guarantee"** operated by the marketplace.
> 3. If genuine custodial escrow is required under Central Bank of Nigeria (CBN) regulations, CampusTrade must partner with a licensed Trustee or commercial bank with dedicated custodial sub-account APIs. The code is abstracted inside `src/lib/payments/flutterwave.ts` to accommodate such an integration seamlessly.
