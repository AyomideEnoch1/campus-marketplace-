/**
 * ==============================================================================
 * FLUTTERWAVE PAYMENT PROVIDER WRAPPER
 * ==============================================================================
 * This module isolates all Flutterwave v3 API calls behind a standard interface.
 * NO OTHER CODE in the codebase may call Flutterwave directly.
 * 
 * Supports:
 * - createPayment(order)
 * - verifyTransaction(id)
 * - verifyWebhook(request)
 * - sendPayout(seller, amount, reference)
 * - getTransferStatus(id)
 * - refund(transactionId, amount, reason)
 * - resolveBankAccount(bankCode, accountNumber)
 * - listBanks()
 * - getMerchantBalance(currency)
 * ==============================================================================
 */

import https from "node:https";
import { HttpsProxyAgent } from "https-proxy-agent";

const FLW_BASE_URL = "https://api.flutterwave.com/v3";

function getSecretKey(): string {
  const key = process.env.FLW_SECRET_KEY || process.env.FLUTTERWAVE_SECRET_KEY;
  if (!key) {
    console.warn("[Flutterwave] FLW_SECRET_KEY is not defined. Using development mock fallback.");
    return "FLWSECK_TEST-mock-key";
  }
  return key;
}

function getSecretHash(): string {
  return process.env.FLW_SECRET_HASH || process.env.FLUTTERWAVE_SECRET_HASH || "campustrade_flw_secret_hash_2026";
}

// ------------------------------------------------------------------------------
// Type Definitions
// ------------------------------------------------------------------------------

export interface CreatePaymentInput {
  txRef: string;
  amount: number;
  currency?: string;
  customer: {
    email: string;
    name: string;
    phoneNumber?: string;
  };
  redirectUrl: string;
  customizations?: {
    title?: string;
    description?: string;
    logo?: string;
  };
  meta?: Record<string, any>;
}

export interface CreatePaymentOutput {
  success: boolean;
  paymentLink: string;
  txRef: string;
  rawResponse?: any;
}

export interface VerifyTransactionOutput {
  success: boolean;
  status: "successful" | "failed" | "pending" | "cancelled" | string;
  txRef: string;
  amount: number;
  currency: string;
  chargedAmount: number;
  flwTransactionId: string | number;
  customer: {
    email: string;
    name: string;
    phone_number?: string;
  };
  paymentType?: string;
  rawResponse: any;
}

export interface PayoutSellerInput {
  bankCode: string;
  accountNumber: string;
  accountName?: string;
}

export interface PayoutOutput {
  success: boolean;
  transferId: string | number;
  status: "pending" | "processing" | "successful" | "failed" | "reversed" | string;
  reference: string;
  fee?: number;
  rawResponse: any;
}

export interface TransferStatusOutput {
  success: boolean;
  status: "pending" | "processing" | "successful" | "failed" | "reversed" | string;
  reference: string;
  transferId: string | number;
  failureReason?: string;
  rawResponse: any;
}

export interface RefundOutput {
  success: boolean;
  refundId: string | number;
  status: string;
  amount: number;
  rawResponse: any;
}

export interface BankAccountResolveOutput {
  success: boolean;
  accountName: string;
  accountNumber: string;
  rawResponse?: any;
}

export interface BankItem {
  id: number | string;
  code: string;
  name: string;
}

export interface MerchantBalanceOutput {
  currency: string;
  availableBalance: number;
  ledgerBalance: number;
}

// ------------------------------------------------------------------------------
// Internal Helper for Flutterwave Fetch
// ------------------------------------------------------------------------------

async function makeProxiedRequest<T = any>(
  urlStr: string,
  method: string,
  headers: Record<string, string>,
  bodyStr?: string,
  timeoutMs = 15000,
  proxyUrl?: string
): Promise<T> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const agent = proxyUrl ? new HttpsProxyAgent(proxyUrl) : undefined;

    const options: https.RequestOptions = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port || 443,
      path: url.pathname + url.search,
      method,
      headers: {
        ...headers,
        ...(bodyStr ? { "Content-Length": String(Buffer.byteLength(bodyStr)) } : {}),
      },
      agent,
      timeout: timeoutMs,
    };

    const req = https.request(options, (res) => {
      let data = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        let parsed: any;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = { status: "error", message: data || "Invalid response from Flutterwave" };
        }

        const isSuccess =
          (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) ||
          parsed?.status === "success";
        if (!isSuccess) {
          const err: any = new Error(parsed?.message || `Flutterwave API error (${res.statusCode})`);
          err.status = res.statusCode;
          err.response = parsed;
          return reject(err);
        }

        resolve(parsed as T);
      });
    });

    req.on("timeout", () => {
      req.destroy();
      reject(new Error(`Flutterwave API request timed out after ${timeoutMs}ms`));
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

async function flwRequest<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" = "GET",
  body?: any,
  timeoutMs = 15000
): Promise<T> {
  const secretKey = getSecretKey();
  const url = `${FLW_BASE_URL}${endpoint}`;

  // If secret key is mock or in offline mode, handle with mock responses
  if (secretKey === "FLWSECK_TEST-mock-key" || process.env.MOCK_FLUTTERWAVE === "true") {
    return handleMockRequest<T>(endpoint, method, body);
  }

  // If FIXIE_URL (or HTTP_PROXY / HTTPS_PROXY) is configured, route via static proxy for IP whitelisting
  const proxyUrl = process.env.FIXIE_URL || process.env.HTTPS_PROXY || process.env.HTTP_PROXY;
  if (proxyUrl) {
    return makeProxiedRequest<T>(
      url,
      method,
      {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body ? JSON.stringify(body) : undefined,
      timeoutMs,
      proxyUrl
    );
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
      signal: controller.signal,
    });

    const data = await res.json().catch(() => ({ status: "error", message: "Invalid JSON from Flutterwave" }));

    if (!res.ok && data?.status !== "success") {
      const errorMsg = data?.message || `Flutterwave API error (${res.status})`;
      const error: any = new Error(errorMsg);
      error.status = res.status;
      error.response = data;
      throw error;
    }

    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ------------------------------------------------------------------------------
// 1. createPayment(order)
// ------------------------------------------------------------------------------

/**
 * Initiates Flutterwave Standard checkout and returns the hosted payment link.
 * NEVER sends client-manipulated prices; amounts must be computed server-side.
 */
export async function createPayment(order: CreatePaymentInput): Promise<CreatePaymentOutput> {
  const payload = {
    tx_ref: order.txRef,
    amount: order.amount,
    currency: order.currency || "NGN",
    redirect_url: order.redirectUrl,
    customer: {
      email: order.customer.email,
      name: order.customer.name,
      phonenumber: order.customer.phoneNumber || "",
    },
    customizations: {
      title: order.customizations?.title || "ọjà Escrow Payment",
      description: order.customizations?.description || `Escrow Order Ref: ${order.txRef}`,
      logo: order.customizations?.logo || "https://campustrade.ng/icons/icon-192x192.png",
    },
    meta: {
      ...order.meta,
      platform: "ọjà",
      protection: "Escrow Held",
    },
  };

  const response = await flwRequest("/payments", "POST", payload);

  if (response.status !== "success" || !response.data?.link) {
    throw new Error(response.message || "Failed to generate Flutterwave payment link");
  }

  return {
    success: true,
    paymentLink: response.data.link,
    txRef: order.txRef,
    rawResponse: response,
  };
}

// ------------------------------------------------------------------------------
// 2. verifyTransaction(id)
// ------------------------------------------------------------------------------

/**
 * Verifies a transaction via Flutterwave's GET /transactions/{id}/verify endpoint.
 * Always check: status === 'successful', tx_ref matches order, amount & currency match exactly.
 */
export async function verifyTransaction(id: string | number): Promise<VerifyTransactionOutput> {
  const response = await flwRequest(`/transactions/${id}/verify`, "GET");

  if (response.status !== "success" || !response.data) {
    throw new Error(response.message || `Failed to verify transaction #${id}`);
  }

  const d = response.data;

  return {
    success: d.status === "successful",
    status: d.status,
    txRef: d.tx_ref,
    amount: Number(d.amount),
    currency: d.currency,
    chargedAmount: Number(d.charged_amount || d.amount),
    flwTransactionId: d.id,
    customer: {
      email: d.customer?.email,
      name: d.customer?.name,
      phone_number: d.customer?.phone_number,
    },
    paymentType: d.payment_type,
    rawResponse: response,
  };
}

// ------------------------------------------------------------------------------
// 3. verifyWebhook(request)
// ------------------------------------------------------------------------------

/**
 * Validates the `verif-hash` header against the FLW_SECRET_HASH.
 * Rejects requests with mismatched or missing secret hash.
 */
export function verifyWebhook(
  headers: Headers | Record<string, string | string[] | undefined>
): boolean {
  const expectedSecretHash = getSecretHash();
  let receivedHash: string | undefined;

  if (headers instanceof Headers) {
    receivedHash = headers.get("verif-hash") || undefined;
  } else {
    const raw = headers["verif-hash"] || headers["Verif-Hash"];
    receivedHash = Array.isArray(raw) ? raw[0] : raw;
  }

  if (!receivedHash || !expectedSecretHash) {
    return false;
  }

  return receivedHash.trim() === expectedSecretHash.trim();
}

// ------------------------------------------------------------------------------
// 4. sendPayout(seller, amount, reference)
// ------------------------------------------------------------------------------

/**
 * Initiates a single payout to the seller's verified bank account using Flutterwave Transfers API.
 * Uses a unique reference to guarantee idempotency.
 */
export async function sendPayout(
  seller: PayoutSellerInput,
  amount: number,
  reference: string
): Promise<PayoutOutput> {
  const payload = {
    account_bank: seller.bankCode,
    account_number: seller.accountNumber,
    amount: amount,
    narration: `ọjà Payout ${reference}`,
    currency: "NGN",
    reference: reference,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL || "https://campustrade.ng"}/api/payments/webhook`,
    debit_currency: "NGN",
  };

  const response = await flwRequest("/transfers", "POST", payload);

  if (response.status !== "success" || !response.data) {
    throw new Error(response.message || `Payout transfer failed for reference ${reference}`);
  }

  const d = response.data;

  // Flutterwave transfer statuses: 'NEW', 'PENDING', 'SUCCESSFUL', 'FAILED'
  const normalizedStatus = (d.status || "pending").toLowerCase();

  return {
    success: normalizedStatus === "successful" || normalizedStatus === "pending" || normalizedStatus === "new",
    transferId: d.id,
    status: normalizedStatus === "new" ? "pending" : normalizedStatus,
    reference: d.reference || reference,
    fee: d.fee,
    rawResponse: response,
  };
}

// ------------------------------------------------------------------------------
// 5. getTransferStatus(id)
// ------------------------------------------------------------------------------

/**
 * Fetches the current transfer status from Flutterwave GET /transfers/{id}.
 */
export async function getTransferStatus(
  id: string | number
): Promise<TransferStatusOutput> {
  const response = await flwRequest(`/transfers/${id}`, "GET");

  if (response.status !== "success" || !response.data) {
    throw new Error(response.message || `Failed to fetch transfer status for #${id}`);
  }

  const d = response.data;
  const status = (d.status || "").toLowerCase();

  return {
    success: status === "successful",
    status: status,
    reference: d.reference,
    transferId: d.id,
    failureReason: d.complete_message || d.narrative,
    rawResponse: response,
  };
}

// ------------------------------------------------------------------------------
// 6. refund(transactionId, amount?, reason?)
// ------------------------------------------------------------------------------

/**
 * Initiates a refund for an existing charge through Flutterwave POST /transactions/{id}/refund.
 */
export async function refund(
  transactionId: string | number,
  amount?: number,
  reason?: string
): Promise<RefundOutput> {
  const payload: Record<string, any> = {};
  if (amount !== undefined) payload.amount = amount;
  if (reason) payload.comments = reason;

  const response = await flwRequest(`/transactions/${transactionId}/refund`, "POST", payload);

  if (response.status !== "success" || !response.data) {
    throw new Error(response.message || `Refund failed for transaction #${transactionId}`);
  }

  const d = response.data;

  return {
    success: true,
    refundId: d.id,
    status: (d.status || "successful").toLowerCase(),
    amount: Number(d.amount_refunded || d.amount || amount),
    rawResponse: response,
  };
}

// ------------------------------------------------------------------------------
// Deterministic Simulated Names for Test/Sandbox Mode
// ------------------------------------------------------------------------------

const SIMULATED_FIRST_NAMES = [
  "CHUKWUDI", "EMMANUEL", "OLUWASEUN", "IBRAHIM", "BLESSING",
  "CHINONSO", "BABATUNDE", "ZAINAB", "NGOZI", "FATIMA",
  "KELECHI", "FOLASHADE", "ABUBAKAR", "TEMITOPE", "SOMTOCHUKWU",
  "ADESANYA", "AISHA", "CHIDIEBERE", "AYOMIDE", "DAMILOLA"
];

const SIMULATED_LAST_NAMES = [
  "OKONKWO", "ADEYEMI", "DANJUMA", "NWOSU", "BELLO",
  "BALOGUN", "EZE", "OLANIYAN", "MOHAMMED", "IGWE",
  "OGUNLEYE", "SULEIMAN", "CHUKWU", "FASHOLA", "YUSUF",
  "ALABI", "OKAFOR", "GARBA", "OSHINOWO", "BAKARE"
];

export function getSimulatedAccountName(accountNumber: string, bankCode: string): string {
  let hash = 0;
  const str = `${accountNumber.trim()}_${bankCode.trim()}`;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const absHash = Math.abs(hash);
  const firstName = SIMULATED_FIRST_NAMES[absHash % SIMULATED_FIRST_NAMES.length];
  const middleName = SIMULATED_FIRST_NAMES[(absHash >> 3) % SIMULATED_FIRST_NAMES.length];
  const lastName = SIMULATED_LAST_NAMES[(absHash >> 6) % SIMULATED_LAST_NAMES.length];
  return `${firstName} ${middleName} ${lastName}`;
}

// ------------------------------------------------------------------------------
// 7. resolveBankAccount(bankCode, accountNumber, fallbackName?)
// ------------------------------------------------------------------------------

/**
 * Resolves an account number against a Nigerian bank code using POST /accounts/resolve.
 * In Live Mode (FLWSECK-...), queries Flutterwave's live NIBSS bank interface.
 * In Test Mode (FLWSECK_TEST-...), Flutterwave's sandbox cannot query NIBSS; resolves
 * dynamically in real-time based on the 10 digits without hanging or repeating static names.
 */
export async function resolveBankAccount(
  bankCode: string,
  accountNumber: string,
  fallbackName?: string
): Promise<BankAccountResolveOutput> {
  const cleanAccount = accountNumber.trim();
  const cleanBank = bankCode.trim();
  const secretKey = getSecretKey();
  const isTestMode =
    secretKey.includes("FLWSECK_TEST") ||
    secretKey === "FLWSECK_TEST-mock-key" ||
    process.env.MOCK_FLUTTERWAVE === "true";

  // In Live mode, call Flutterwave live API to resolve real NIBSS account details
  if (!isTestMode) {
    const payload: Record<string, any> = {
      account_number: cleanAccount,
      account_bank: cleanBank,
    };

    try {
      const response = await flwRequest("/accounts/resolve", "POST", payload, 6000);

      if (response?.status === "success" && response?.data?.account_name) {
        return {
          success: true,
          accountName: String(response.data.account_name).toUpperCase(),
          accountNumber: response.data.account_number || cleanAccount,
          rawResponse: response,
        };
      }

      throw new Error(response?.message || "Could not resolve bank account details with Flutterwave");
    } catch (err: any) {
      throw new Error(err.message || "Failed to resolve bank account. Please check the account number and bank.");
    }
  }

  // In Test/Sandbox Mode:
  // Flutterwave sandbox rejects live NIBSS queries with 503 / "An error occurred".
  // Instantly return a real-time deterministic Nigerian name unique to this account number and bank.
  const dynamicName = getSimulatedAccountName(cleanAccount, cleanBank);

  return {
    success: true,
    accountName: dynamicName,
    accountNumber: cleanAccount,
    rawResponse: { simulated: true, isTestMode: true },
  };
}

// ------------------------------------------------------------------------------
// 8. listBanks()
// ------------------------------------------------------------------------------

export const DEFAULT_NIGERIAN_BANKS: BankItem[] = [
  { id: 1, code: "044", name: "Access Bank" },
  { id: 2, code: "023", name: "Citibank" },
  { id: 3, code: "050", name: "Ecobank Nigeria" },
  { id: 4, code: "070", name: "Fidelity Bank" },
  { id: 5, code: "011", name: "First Bank of Nigeria" },
  { id: 6, code: "214", name: "First City Monument Bank (FCMB)" },
  { id: 7, code: "058", name: "Guaranty Trust Bank (GTBank)" },
  { id: 8, code: "030", name: "Heritage Bank" },
  { id: 9, code: "301", name: "Jaiz Bank" },
  { id: 10, code: "082", name: "Keystone Bank" },
  { id: 11, code: "50211", name: "Kuda Bank" },
  { id: 12, code: "999991", name: "OPay Digital Services" },
  { id: 13, code: "999992", name: "PalmPay" },
  { id: 14, code: "101", name: "Providus Bank" },
  { id: 15, code: "221", name: "Stanbic IBTC Bank" },
  { id: 16, code: "068", name: "Standard Chartered Bank" },
  { id: 17, code: "232", name: "Sterling Bank" },
  { id: 18, code: "100", name: "Suntrust Bank" },
  { id: 19, code: "032", name: "Union Bank of Nigeria" },
  { id: 20, code: "033", name: "United Bank for Africa (UBA)" },
  { id: 21, code: "215", name: "Unity Bank" },
  { id: 22, code: "035", name: "Wema Bank" },
  { id: 23, code: "057", name: "Zenith Bank" },
];

let cachedBanksList: BankItem[] = DEFAULT_NIGERIAN_BANKS;
let lastBanksCacheTime = 0;
const BANKS_CACHE_DURATION_MS = 60 * 60 * 1000; // 1 hour

/**
 * Returns the list of supported Nigerian commercial & digital banks from GET /banks/NG.
 * Automatically falls back to DEFAULT_NIGERIAN_BANKS on timeout, error, or slow network so the UI is NEVER blank.
 */
export async function listBanks(): Promise<BankItem[]> {
  const now = Date.now();
  if (cachedBanksList && cachedBanksList.length > 0 && now - lastBanksCacheTime < BANKS_CACHE_DURATION_MS) {
    return cachedBanksList;
  }

  try {
    const secretKey = getSecretKey();
    if (secretKey === "FLWSECK_TEST-mock-key" || process.env.MOCK_FLUTTERWAVE === "true") {
      cachedBanksList = DEFAULT_NIGERIAN_BANKS;
      lastBanksCacheTime = now;
      return cachedBanksList;
    }

    const response = await flwRequest("/banks/NG", "GET", undefined, 3500);

    if (response?.status === "success" && Array.isArray(response?.data) && response.data.length > 0) {
      cachedBanksList = response.data.map((b: any) => ({
        id: b.id,
        code: b.code,
        name: b.name,
      }));
      lastBanksCacheTime = now;
      return cachedBanksList;
    }
  } catch (err) {
    console.warn("[Flutterwave] listBanks fetch timed out or failed; falling back to default Nigerian banks list");
  }

  // Graceful fallback to comprehensive Nigerian banks list
  cachedBanksList = DEFAULT_NIGERIAN_BANKS;
  lastBanksCacheTime = now;
  return DEFAULT_NIGERIAN_BANKS;
}

// ------------------------------------------------------------------------------
// 9. getMerchantBalance(currency?)
// ------------------------------------------------------------------------------

/**
 * Retrieves the merchant account balance from GET /balances.
 * Used for platform reconciliation (ledger vs Flutterwave balance) and low-balance warnings.
 */
export async function getMerchantBalance(currency = "NGN"): Promise<MerchantBalanceOutput> {
  try {
    const response = await flwRequest(`/balances`, "GET");

    if (response.status === "success" && Array.isArray(response.data)) {
      const match = response.data.find((b: any) => b.currency === currency) || response.data[0];
      if (match) {
        return {
          currency: match.currency,
          availableBalance: Number(match.available_balance || 0),
          ledgerBalance: Number(match.ledger_balance || 0),
        };
      }
    }
  } catch (err) {
    console.warn("[Flutterwave] Balance query failed, returning fallback estimate:", err);
  }

  return {
    currency: "NGN",
    availableBalance: 0,
    ledgerBalance: 0,
  };
}

// ------------------------------------------------------------------------------
// Development / Mock Handlers
// ------------------------------------------------------------------------------

function handleMockRequest<T>(endpoint: string, method: string, body?: any): T {
  if (endpoint.startsWith("/payments")) {
    return {
      status: "success",
      message: "Hosted Link Generated (Mock)",
      data: {
        link: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/checkout/mock-flw-gateway?tx_ref=${body?.tx_ref}&amount=${body?.amount}`,
      },
    } as any;
  }

  if (endpoint.includes("/verify")) {
    return {
      status: "success",
      message: "Transaction fetched successfully (Mock)",
      data: {
        id: 987654321,
        tx_ref: "mock_tx_ref",
        flw_ref: "FLW_MOCK_REF_123",
        amount: 15000,
        currency: "NGN",
        charged_amount: 15000,
        status: "successful",
        payment_type: "card",
        customer: {
          name: "Test Campus Buyer",
          email: "buyer@campus.edu.ng",
          phone_number: "08012345678",
        },
      },
    } as any;
  }

  if (endpoint.startsWith("/transfers") && method === "POST") {
    return {
      status: "success",
      message: "Transfer Queued Successfully (Mock)",
      data: {
        id: 11223344,
        account_number: body?.account_number,
        bank_code: body?.account_bank,
        full_name: "Test Vendor Payout",
        amount: body?.amount,
        fee: 10.75,
        reference: body?.reference,
        status: "SUCCESSFUL",
        complete_message: "Payout executed successfully via Flutterwave mock",
      },
    } as any;
  }

  if (endpoint.includes("/transfers/")) {
    return {
      status: "success",
      message: "Transfer details fetched (Mock)",
      data: {
        id: 11223344,
        reference: "mock_reference",
        status: "SUCCESSFUL",
        complete_message: "Transfer completed",
      },
    } as any;
  }

  if (endpoint.includes("/refund")) {
    return {
      status: "success",
      message: "Refund processed (Mock)",
      data: {
        id: 556677,
        status: "successful",
        amount_refunded: body?.amount || 5000,
      },
    } as any;
  }

  if (endpoint.includes("/accounts/resolve")) {
    return {
      status: "success",
      message: "Account details resolved (Mock)",
      data: {
        account_number: body?.account_number,
        account_name: body?.fallback_name ? String(body.fallback_name).toUpperCase() : "VERIFIED ACCOUNT HOLDER",
      },
    } as any;
  }

  if (endpoint.startsWith("/banks")) {
    return {
      status: "success",
      data: DEFAULT_NIGERIAN_BANKS,
    } as any;
  }

  if (endpoint.startsWith("/balances")) {
    return {
      status: "success",
      data: [
        {
          currency: "NGN",
          available_balance: 850000.0,
          ledger_balance: 850000.0,
        },
      ],
    } as any;
  }

  return { status: "success", data: {} } as any;
}
