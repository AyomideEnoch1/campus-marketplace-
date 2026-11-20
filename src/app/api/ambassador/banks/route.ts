import { NextResponse } from "next/server";
import { listBanks, resolveBankAccount } from "@/lib/payments/flutterwave";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const banks = await listBanks();
    return NextResponse.json({ banks });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to list banks" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bankCode, accountNumber } = await request.json();

    if (!bankCode || !accountNumber || accountNumber.length !== 10) {
      return NextResponse.json(
        { error: "Valid 10-digit account number and bank code are required" },
        { status: 400 }
      );
    }

    const result = await resolveBankAccount(bankCode, accountNumber);

    return NextResponse.json({
      success: true,
      accountName: result.accountName,
      accountNumber: result.accountNumber,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Could not verify bank account details" },
      { status: 400 }
    );
  }
}
