import { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://campustrade.ng";

  // Static core routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date() },
    { url: `${baseUrl}/shop`, lastModified: new Date() },
    { url: `${baseUrl}/campuses`, lastModified: new Date() },
    { url: `${baseUrl}/vendors`, lastModified: new Date() },
    { url: `${baseUrl}/about`, lastModified: new Date() },
    { url: `${baseUrl}/safety`, lastModified: new Date() },
    { url: `${baseUrl}/terms`, lastModified: new Date() },
    { url: `${baseUrl}/privacy`, lastModified: new Date() },
    { url: `${baseUrl}/vendor-guidelines`, lastModified: new Date() },
  ];

  try {
    const [products, vendors, categories, campuses] = await Promise.all([
      prisma.product.findMany({
        where: { status: "PUBLISHED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.vendorProfile.findMany({
        where: { status: "APPROVED" },
        select: { slug: true, updatedAt: true },
      }),
      prisma.category.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
      prisma.campus.findMany({
        where: { isActive: true },
        select: { slug: true, updatedAt: true },
      }),
    ]);

    const productUrls: MetadataRoute.Sitemap = products.map((p) => ({
      url: `${baseUrl}/product/${p.slug}`,
      lastModified: p.updatedAt,
    }));

    const vendorUrls: MetadataRoute.Sitemap = vendors.map((v) => ({
      url: `${baseUrl}/store/${v.slug}`,
      lastModified: v.updatedAt,
    }));

    const categoryUrls: MetadataRoute.Sitemap = categories.map((c) => ({
      url: `${baseUrl}/shop?category=${c.slug}`,
      lastModified: c.updatedAt,
    }));

    const campusUrls: MetadataRoute.Sitemap = campuses.map((cp) => ({
      url: `${baseUrl}/campuses?campus=${cp.slug}`,
      lastModified: cp.updatedAt,
    }));

    return [
      ...staticRoutes,
      ...productUrls,
      ...vendorUrls,
      ...categoryUrls,
      ...campusUrls,
    ];
  } catch (e) {
    return staticRoutes;
  }
}
