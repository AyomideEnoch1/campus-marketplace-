import { NextResponse } from "next/server";
import { listBanks, resolveBankAccount, DEFAULT_NIGERIAN_BANKS } from "@/lib/payments/flutterwave";
import { getSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const banks = await listBanks();
    return NextResponse.json({ banks: banks && banks.length > 0 ? banks : DEFAULT_NIGERIAN_BANKS });
  } catch (err: any) {
    console.warn("[Ambassador Banks GET]: Error fetching bank list, using default banks fallback", err);
    return NextResponse.json({ banks: DEFAULT_NIGERIAN_BANKS });
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

    const secretKey = process.env.FLW_SECRET_KEY || "";
    const isLive = secretKey.startsWith("FLWSECK-") && !secretKey.includes("FLWSECK_TEST");

    return NextResponse.json({
      success: true,
      accountName: result.accountName,
      accountNumber: result.accountNumber,
      isLive,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message || "Could not verify bank account details" },
      { status: 400 }
    );
  }
}
