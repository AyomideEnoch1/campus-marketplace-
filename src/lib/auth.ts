import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { Role, SessionUser } from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-campus-trade-market-min-32-chars";
export const AUTH_COOKIE_NAME = "campus_market_session";
export const AUTH_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(
  payload: { userId: string; role: string; email: string; activeRole?: string },
  expiresIn: any = "30d"
): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

export function verifyToken(token: string): { userId: string; role: string; email: string; activeRole?: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string; email: string; activeRole?: string };
  } catch {
    return null;
  }
}

export function signPasswordResetToken(payload: { userId: string; email: string }): string {
  return jwt.sign({ ...payload, purpose: "password_reset" }, JWT_SECRET, { expiresIn: "1h" });
}

export function verifyPasswordResetToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded?.purpose !== "password_reset" || !decoded?.userId || !decoded?.email) {
      return null;
    }
    return { userId: decoded.userId, email: decoded.email };
  } catch {
    return null;
  }
}

export function signEmailVerificationToken(payload: { userId: string; email: string; code?: string }): string {
  return jwt.sign({ ...payload, purpose: "email_verification" }, JWT_SECRET, { expiresIn: "24h" });
}

export function verifyEmailVerificationToken(token: string): { userId: string; email: string; code?: string } | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded?.purpose !== "email_verification" || !decoded?.userId || !decoded?.email) {
      return null;
    }
    return { userId: decoded.userId, email: decoded.email, code: decoded.code };
  } catch {
    return null;
  }
}

export const getSession = cache(async (): Promise<SessionUser | null> => {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          avatarUrl: true,
          vendorProfile: {
            select: {
              id: true,
              storeName: true,
              slug: true,
              status: true,
              campusId: true,
              layout: true,
            },
          },
          ambassadorProfile: {
            select: {
              id: true,
              referralCode: true,
              status: true,
              campusId: true,
              totalEarnings: true,
              pendingEarnings: true,
              paidEarnings: true,
              campus: {
                select: { name: true },
              },
            },
          },
        },
      });

      if (!user) return null;

      const hasVendorProfile = Boolean(user.vendorProfile || user.role === "VENDOR");
      const activeRole = (decoded.activeRole || user.role) as Role;

      return {
        id: user.id,
        userId: user.id,
        email: user.email,
        fullName: user.fullName,
        role: activeRole,
        activeRole: activeRole,
        canSwitchRole: hasVendorProfile,
        avatarUrl: user.avatarUrl,
        vendorProfile: user.vendorProfile
          ? {
              id: user.vendorProfile.id,
              storeName: user.vendorProfile.storeName,
              slug: user.vendorProfile.slug,
              status: user.vendorProfile.status as any,
              campusId: user.vendorProfile.campusId,
              layout: user.vendorProfile.layout,
            }
          : null,
        ambassadorProfile: user.ambassadorProfile
          ? {
              id: user.ambassadorProfile.id,
              referralCode: user.ambassadorProfile.referralCode,
              status: user.ambassadorProfile.status as any,
              campusId: user.ambassadorProfile.campusId,
              campusName: user.ambassadorProfile.campus?.name,
              totalEarnings: user.ambassadorProfile.totalEarnings,
              pendingEarnings: user.ambassadorProfile.pendingEarnings,
              paidEarnings: user.ambassadorProfile.paidEarnings,
            }
          : null,
      };
    } catch (dbError) {
      console.warn("Database lookup warning during getSession, using verified JWT token fallback:", dbError);
      const activeRole = (decoded.activeRole || decoded.role) as Role;
      return {
        id: decoded.userId,
        userId: decoded.userId,
        email: decoded.email,
        fullName: activeRole === "VENDOR" ? "Campus Vendor" : "Student Buyer",
        role: activeRole,
        activeRole: activeRole,
        canSwitchRole: decoded.role === "VENDOR",
        avatarUrl: null,
        vendorProfile: null,
      };
    }
  } catch (error) {
    console.error("Error retrieving session:", error);
    return null;
  }
});

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized: Please sign in to continue");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    throw new Error("Forbidden: Administrator access required");
  }
  return user;
}

export async function requireSuperAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "SUPERADMIN" && user.role !== "ADMIN") {
    throw new Error("Forbidden: Administrator access required");
  }
  return user;
}

export async function requireVendor(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "VENDOR" && user.role !== "ADMIN" && user.role !== "SUPERADMIN") {
    throw new Error("Forbidden: Vendor access required");
  }
  return user;
}
