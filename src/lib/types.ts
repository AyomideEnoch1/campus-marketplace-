export type Role = "ADMIN" | "VENDOR" | "BUYER";
export type VendorStatus = "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED";
export type ProductCondition = "NEW" | "USED_LIKE_NEW" | "USED_GOOD" | "USED_FAIR";
export type ProductStatus = "DRAFT" | "PUBLISHED" | "HIDDEN" | "FLAGGED";
export type OrderStatus = "PENDING" | "CONFIRMED" | "DELIVERED" | "CANCELLED";
export type StoreLayout = "grid" | "list" | "showcase" | "lookbook";

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: Role;
  avatarUrl?: string | null;
  vendorProfile?: {
    id: string;
    storeName: string;
    slug: string;
    status: VendorStatus;
    campusId: string;
    layout: string;
  } | null;
}

export interface ProductWithVendor {
  id: string;
  title: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number | null;
  stock: number;
  condition: string;
  status: string;
  model3dUrl?: string | null;
  videoUrl?: string | null;
  tags?: string | null;
  viewsCount: number;
  isFeatured: boolean;
  createdAt: Date | string;
  images: { id: string; url: string; position: number }[];
  category: { id: string; name: string; slug: string };
  vendor: {
    id: string;
    storeName: string;
    slug: string;
    layout: string;
    brandColor: string;
    whatsapp: string;
    campus: { id: string; name: string; slug: string; city: string };
  };
}
