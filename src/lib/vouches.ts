import { prisma } from "@/lib/prisma";

/**
 * Propagate a strike to the voucher if an upheld scam report or penalty
 * is issued against a guest vendor.
 */
export async function propagateVoucherStrike(
  guestVendorId: string,
  reason: string = "Upheld report against vouched guest vendor"
) {
  try {
    // 1. Find the guest vendor
    const guest = await prisma.vendorProfile.findUnique({
      where: { id: guestVendorId },
      include: {
        vouchesReceived: {
          where: { status: "ACCEPTED" },
          include: { voucher: { include: { vendorProfile: true } } },
        },
      },
    });

    if (!guest) return null;

    // Increment strike on guest
    await prisma.vendorProfile.update({
      where: { id: guestVendorId },
      data: { strikesCount: { increment: 1 } },
    });

    // 2. Identify voucher(s)
    const results = [];
    for (const vouch of guest.vouchesReceived) {
      const voucherUser = vouch.voucher;
      if (voucherUser?.vendorProfile) {
        // Increment strike on voucher vendor
        const updatedVoucher = await prisma.vendorProfile.update({
          where: { id: voucherUser.vendorProfile.id },
          data: {
            strikesCount: { increment: 1 },
            // If strikes exceed 2, revoke trusted seller badge
            ...(voucherUser.vendorProfile.strikesCount >= 2
              ? { isTrustedSeller: false }
              : {}),
          },
        });

        // Log strike activity
        await prisma.activityLog.create({
          data: {
            userId: voucherUser.id,
            action: "VOUCHER_STRIKE_PROPAGATED",
            entityType: "VendorProfile",
            entityId: voucherUser.vendorProfile.id,
            metadataJson: JSON.stringify({
              guestVendorId,
              guestStoreName: guest.storeName,
              voucherStoreName: voucherUser.vendorProfile.storeName,
              reason,
              newStrikesCount: updatedVoucher.strikesCount,
            }),
          },
        });

        results.push(updatedVoucher);
      }
    }

    return results;
  } catch (error) {
    console.error("Failed to propagate voucher strike:", error);
    return null;
  }
}

/**
 * Create a verified vouch from an admin or a Trusted Seller for a guest vendor
 */
export async function createVouch({
  voucherUserId,
  guestVendorId,
  notes,
}: {
  voucherUserId: string;
  guestVendorId: string;
  notes?: string;
}) {
  const voucherUser = await prisma.user.findUnique({
    where: { id: voucherUserId },
    include: { vendorProfile: true },
  });

  if (!voucherUser) {
    throw new Error("Voucher user account not found");
  }

  const isAdmin = voucherUser.role === "ADMIN";
  const isTrusted = voucherUser.vendorProfile?.isTrustedSeller === true;

  if (!isAdmin && !isTrusted) {
    throw new Error("Only platform Administrators or Trusted Sellers can vouch for guest vendors.");
  }

  const guest = await prisma.vendorProfile.findUnique({
    where: { id: guestVendorId },
  });

  if (!guest) {
    throw new Error("Guest vendor not found");
  }

  // Create vouch record
  const vouch = await prisma.vouch.create({
    data: {
      voucherId: voucherUserId,
      guestId: guestVendorId,
      status: "ACCEPTED",
      notes: notes || "Vouched by verified trusted seller",
    },
  });

  // Update guest vendor profile to record vouch and shorten payout delay
  await prisma.vendorProfile.update({
    where: { id: guestVendorId },
    data: {
      vouchedBy: voucherUserId,
      payoutDelayHours: Math.min(guest.payoutDelayHours, 48), // Expedite payout delay
    },
  });

  return vouch;
}
