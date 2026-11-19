import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { Role, SessionUser } from "./types";

const JWT_SECRET = process.env.JWT_SECRET || "fallback-secret-for-campus-trade-market-min-32-chars";
export const AUTH_COOKIE_NAME = "campus_market_session";

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(payload: { userId: string; role: string; email: string; activeRole?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): { userId: string; role: string; email: string; activeRole?: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; role: string; email: string; activeRole?: string };
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
    if (!token) return null;

    const decoded = verifyToken(token);
    if (!decoded) return null;

    try {
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
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
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSession();
  if (!user) {
    throw new Error("Unauthorized: Please sign in to continue");
  }
  return user;
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "ADMIN") {
    throw new Error("Forbidden: Super Administrator access required");
  }
  return user;
}

export async function requireVendor(): Promise<SessionUser> {
  const user = await requireAuth();
  if (user.role !== "VENDOR" && user.role !== "ADMIN") {
    throw new Error("Forbidden: Vendor access required");
  }
  return user;
}
