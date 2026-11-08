import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { AccountClient } from "./AccountClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "My Account | CampusTrade Marketplace",
  description: "Manage your campus account profile, contact information, and order history.",
};

export default async function AccountPage() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login?redirect=/account");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.id },
    include: {
      vendorProfile: {
        include: {
          campus: true,
        },
      },
      orders: {
        orderBy: { createdAt: "desc" },
        take: 3,
        include: {
          vendor: {
            select: {
              storeName: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  title: true,
                  images: {
                    take: 1,
                    select: { url: true },
                  },
                },
              },
            },
          },
        },
      },
      _count: {
        select: {
          orders: true,
          favorites: true,
          productReviews: true,
        },
      },
    },
  });

  if (!user) {
    redirect("/auth/login");
  }

  const sanitizedUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    role: user.role,
    avatarUrl: user.avatarUrl,
    createdAt: user.createdAt,
    vendorProfile: user.vendorProfile
      ? {
          id: user.vendorProfile.id,
          storeName: user.vendorProfile.storeName,
          slug: user.vendorProfile.slug,
          status: user.vendorProfile.status,
          campus: user.vendorProfile.campus
            ? {
                id: user.vendorProfile.campus.id,
                name: user.vendorProfile.campus.name,
                city: user.vendorProfile.campus.city,
              }
            : null,
        }
      : null,
    orders: user.orders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      totalAmount: o.totalAmount,
      status: o.status,
      createdAt: o.createdAt,
      vendor: {
        storeName: o.vendor.storeName,
      },
      items: o.items.map((i) => ({
        id: i.id,
        quantity: i.quantity,
        product: {
          title: i.product.title,
          images: i.product.images,
        },
      })),
    })),
    favoritesCount: user._count.favorites,
    reviewsCount: user._count.productReviews,
    totalOrdersCount: user._count.orders,
  };

  return <AccountClient initialUser={sanitizedUser} />;
}
