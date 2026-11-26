import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { resolveBankAccount, listBanks } from "@/lib/payments/flutterwave";

export const dynamic = "force-dynamic";

function calculateNameSimilarity(nameA: string, nameB: string): number {
  const cleanA = nameA.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const cleanB = nameB.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();

  if (cleanA === cleanB) return 1.0;

  const tokensA = cleanA.split(/\s+/);
  const tokensB = cleanB.split(/\s+/);

  // Check how many tokens from A exist in B
  let matches = 0;
  for (const t of tokensA) {
    if (tokensB.includes(t)) matches++;
  }

  const tokenOverlap = (2 * matches) / (tokensA.length + tokensB.length);
  return tokenOverlap;
}

export async function POST(req: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { bankCode, accountNumber, save } = body;

    if (!bankCode || !accountNumber) {
      return NextResponse.json({ error: "bankCode and accountNumber are required" }, { status: 400 });
    }

    const cleanAccount = String(accountNumber).trim();
    if (cleanAccount.length !== 10 || !/^\d{10}$/.test(cleanAccount)) {
      return NextResponse.json({ error: "Account number must be exactly 10 digits" }, { status: 400 });
    }

    // 1. Resolve Account Name with Flutterwave
    const resolved = await resolveBankAccount(bankCode, cleanAccount, session.fullName);

    if (!resolved.success || !resolved.accountName) {
      return NextResponse.json(
        { error: "Could not resolve bank account details. Please verify your account number and bank." },
        { status: 400 }
      );
    }

    const resolvedName = resolved.accountName.toUpperCase();

    // 2. Fetch Seller Profile
    const seller = await prisma.vendorProfile.findFirst({
      where: {
        OR: [
          { userId: session.id },
          { user: { email: session.email } },
        ],
      },
      include: {
        user: true,
        sellerBankAccount: true,
      },
    });

    if (!seller) {
      return NextResponse.json({ error: "Vendor profile not found" }, { status: 404 });
    }

    // 3. Uniqueness Check: ensure this bank account does not belong to another seller
    const existingOther = await prisma.sellerBankAccount.findFirst({
      where: {
        bankCode,
        accountNumber: cleanAccount,
        sellerId: { not: seller.id },
      },
    });

    if (existingOther) {
      return NextResponse.json(
        { error: "This bank account is already registered to another active seller account." },
        { status: 400 }
      );
    }

    // 4. Name Matching against Seller Legal Name / Business Name
    const targetNames = [
      seller.user.fullName,
      seller.businessName,
      seller.storeName,
    ].filter(Boolean) as string[];

    let bestSimilarity = 0;
    for (const target of targetNames) {
      const sim = calculateNameSimilarity(target, resolvedName);
      if (sim > bestSimilarity) bestSimilarity = sim;
    }

    // Similarity threshold: 0.40 allows minor spelling variations / middle name omissions
    const nameMatches = bestSimilarity >= 0.4;

    // Lookup Bank Name
    const banks = await listBanks().catch(() => []);
    const bankItem = banks.find((b) => b.code === bankCode);
    const bankName = bankItem?.name || `Bank (${bankCode})`;

    // If 'save' flag is set, persist in database
    if (save) {
      // If changing account, reset verification until verified
      const isVerified = nameMatches;

      await prisma.$transaction([
        prisma.sellerBankAccount.upsert({
          where: { sellerId: seller.id },
          create: {
            sellerId: seller.id,
            bankCode,
            bankName,
            accountNumber: cleanAccount,
            accountName: resolvedName,
            verified: isVerified,
            verifiedAt: isVerified ? new Date() : null,
          },
          update: {
            bankCode,
            bankName,
            accountNumber: cleanAccount,
            accountName: resolvedName,
            verified: isVerified,
            verifiedAt: isVerified ? new Date() : null,
          },
        }),
        prisma.vendorProfile.update({
          where: { id: seller.id },
          data: {
            bankCode,
            bankName,
            bankAccountNumber: cleanAccount,
            bankResolvedName: resolvedName,
            bankAccountName: resolvedName,
            bankVerified: isVerified,
          },
        }),
      ]);
    }

    return NextResponse.json({
      success: true,
      accountName: resolvedName,
      accountNumber: cleanAccount,
      bankCode,
      bankName,
      nameMatches,
      similarityScore: Math.round(bestSimilarity * 100),
      legalName: seller.user.fullName,
      verified: nameMatches,
    });
  } catch (error: any) {
    console.error("[Resolve Bank Account Error]:", error);
    return NextResponse.json({ error: error.message || "Failed to resolve bank account" }, { status: 500 });
  }
}
