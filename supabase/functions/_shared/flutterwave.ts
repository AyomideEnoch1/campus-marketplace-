/**
 * ==============================================================================
 * FLUTTERWAVE PAYMENT PROVIDER WRAPPER FOR SUPABASE EDGE FUNCTIONS (DENO / TS)
 * ==============================================================================
 */

// @ts-ignore
const DenoEnv = typeof Deno !== "undefined" ? Deno.env : { get: (k: string) => process.env[k] };

const FLW_BASE_URL = "https://api.flutterwave.com/v3";

function getSecretKey(): string {
  const key = DenoEnv.get("FLW_SECRET_KEY") || DenoEnv.get("FLUTTERWAVE_SECRET_KEY");
  if (!key) {
    console.warn("[Flutterwave Edge] FLW_SECRET_KEY not set. Using test key.");
    return "FLWSECK_TEST-mock-key";
  }
  return key;
}

function getSecretHash(): string {
  return DenoEnv.get("FLW_SECRET_HASH") || DenoEnv.get("FLUTTERWAVE_SECRET_HASH") || "campustrade_flw_secret_hash_2026";
}

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
  status: string;
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
  status: string;
  reference: string;
  fee?: number;
  rawResponse: any;
}

export interface TransferStatusOutput {
  success: boolean;
  status: string;
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

async function flwRequest<T = any>(
  endpoint: string,
  method: "GET" | "POST" | "PUT" = "GET",
  body?: any
): Promise<T> {
  const secretKey = getSecretKey();
  const url = `${FLW_BASE_URL}${endpoint}`;

  if (secretKey === "FLWSECK_TEST-mock-key") {
    return handleMockRequest<T>(endpoint, method, body);
  }

  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
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
}

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
      title: order.customizations?.title || "CampusTrade Escrow Payment",
      description: order.customizations?.description || `Escrow Order Ref: ${order.txRef}`,
      logo: order.customizations?.logo || "https://campustrade.ng/icons/icon-192x192.png",
    },
    meta: {
      ...order.meta,
      platform: "CampusTrade",
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

export async function sendPayout(
  seller: PayoutSellerInput,
  amount: number,
  reference: string
): Promise<PayoutOutput> {
  const payload = {
    account_bank: seller.bankCode,
    account_number: seller.accountNumber,
    amount: amount,
    narration: `CampusTrade Payout ${reference}`,
    currency: "NGN",
    reference: reference,
    callback_url: `${DenoEnv.get("NEXT_PUBLIC_APP_URL") || "https://campustrade.ng"}/api/payments/webhook`,
    debit_currency: "NGN",
  };

  const response = await flwRequest("/transfers", "POST", payload);

  if (response.status !== "success" || !response.data) {
    throw new Error(response.message || `Payout transfer failed for reference ${reference}`);
  }

  const d = response.data;
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

export async function resolveBankAccount(
  bankCode: string,
  accountNumber: string
): Promise<BankAccountResolveOutput> {
  const payload = {
    account_number: accountNumber.trim(),
    account_bank: bankCode.trim(),
  };

  const response = await flwRequest("/accounts/resolve", "POST", payload);

  if (response.status !== "success" || !response.data) {
    throw new Error(response.message || "Could not resolve bank account details with Flutterwave");
  }

  return {
    success: true,
    accountName: response.data.account_name,
    accountNumber: response.data.account_number,
    rawResponse: response,
  };
}

export async function listBanks(): Promise<BankItem[]> {
  const response = await flwRequest("/banks/NG", "GET");

  if (response.status !== "success" || !Array.isArray(response.data)) {
    return [
      { id: 1, code: "044", name: "Access Bank" },
      { id: 5, code: "011", name: "First Bank of Nigeria" },
      { id: 7, code: "058", name: "Guaranty Trust Bank (GTBank)" },
      { id: 11, code: "50211", name: "Kuda Bank" },
      { id: 12, code: "999991", name: "OPay Digital Services" },
      { id: 13, code: "999992", name: "PalmPay" },
      { id: 20, code: "033", name: "United Bank for Africa (UBA)" },
      { id: 23, code: "057", name: "Zenith Bank" },
    ];
  }

  return response.data.map((b: any) => ({
    id: b.id,
    code: b.code,
    name: b.name,
  }));
}

function handleMockRequest<T>(endpoint: string, method: string, body?: any): T {
  if (endpoint.startsWith("/payments")) {
    return {
      status: "success",
      message: "Hosted Link Generated (Mock)",
      data: {
        link: `${DenoEnv.get("NEXT_PUBLIC_APP_URL") || "http://localhost:3000"}/checkout/mock-flw-gateway?tx_ref=${body?.tx_ref}&amount=${body?.amount}`,
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
        account_name: "AYOMIDE ENOCH OLABISI",
      },
    } as any;
  }

  return { status: "success", data: {} } as any;
}
