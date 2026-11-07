import Link from "next/link";
import { Store, MapPin, Package, ShieldCheck, ArrowRight, MessageCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Student Vendors Directory | CampusTrade",
  description: "Browse verified student-run businesses and independent campus sellers.",
};

interface VendorsPageProps {
  searchParams: {
    campus?: string;
  };
}

export default async function VendorsPage({ searchParams }: VendorsPageProps) {
  const { campus } = searchParams;

  const where: any = {
    status: "APPROVED",
  };

  if (campus) {
    where.campus = { slug: campus };
  }

  const [vendors, campuses] = await Promise.all([
    prisma.vendorProfile.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        campus: true,
        _count: { select: { products: true } },
      },
    }),
    prisma.campus.findMany({ where: { isActive: true } }),
  ]);

  return (
    <div className="min-h-screen bg-neutral-50/60 pb-20">
      {/* Header */}
      <section className="bg-neutral-900 text-white py-14 px-4 border-b border-neutral-800">
        <div className="container mx-auto max-w-4xl text-center space-y-3">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            Student Entrepreneurs
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Verified Campus Storefronts
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 max-w-2xl mx-auto">
            Discover peer-owned campus stores across UNILAG, UI, and OAU. Chat with student sellers directly on WhatsApp.
          </p>
        </div>
      </section>

      {/* Header Info & Seller CTA */}
      <div className="border-b border-neutral-200 bg-white sticky top-16 md:top-20 z-20 py-3 shadow-xs">
        <div className="container mx-auto px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-800">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span>{vendors.length} Verified Student Stores Active</span>
          </div>

          <Link href="/vendor/register">
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold">
              Become a Seller &rarr;
            </Button>
          </Link>
        </div>
      </div>

      {/* Vendors Grid */}
      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((v) => (
            <div
              key={v.id}
              className="group rounded-3xl bg-white border border-neutral-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Store Header Banner */}
                <div className="h-32 w-full relative bg-neutral-900 overflow-hidden">
                  {v.banner ? (
                    <img
                      src={v.banner}
                      alt={v.storeName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div
                      className="w-full h-full opacity-80"
                      style={{
                        background: `linear-gradient(135deg, ${v.brandColor || "#059669"} 0%, #0F172A 100%)`,
                      }}
                    />
                  )}
                  <div className="absolute top-3 right-3">
                    <Badge variant="dark" className="bg-black/60 backdrop-blur-md text-[10px] uppercase font-bold text-white border-0">
                      {v.layout} template
                    </Badge>
                  </div>
                </div>

                {/* Logo & Info */}
                <div className="p-6 pt-0 relative space-y-3">
                  <div className="-mt-10 mb-2 relative">
                    <div className="w-16 h-16 rounded-2xl border-4 border-white overflow-hidden shadow-md bg-white">
                      {v.logo ? (
                        <img
                          src={v.logo}
                          alt={v.storeName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center font-bold text-xl text-white"
                          style={{ backgroundColor: v.brandColor || "#059669" }}
                        >
                          {v.storeName[0]}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-bold text-base text-neutral-950 group-hover:text-emerald-700 transition-colors">
                        {v.storeName}
                      </h3>
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    </div>

                    <p className="text-xs text-neutral-500 flex items-center gap-1 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{v.campus?.name}</span>
                      {v.faculty && <span>&bull; {v.faculty}</span>}
                    </p>
                  </div>

                  <p className="text-xs text-neutral-600 line-clamp-2 leading-relaxed">
                    {v.storeDescription || "Verified campus student storefront."}
                  </p>

                  <div className="pt-2 flex items-center justify-between text-xs text-neutral-500 border-t border-neutral-100">
                    <span className="font-semibold text-neutral-800 flex items-center gap-1">
                      <Package className="w-3.5 h-3.5 text-neutral-400" />
                      {v._count.products} Products Listed
                    </span>
                    {v.whatsapp && (
                      <span className="text-emerald-600 font-bold flex items-center gap-1 text-[11px]">
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp Orders
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* View Store Button */}
              <div className="p-6 pt-0">
                <Link href={`/store/${v.slug}`} className="block">
                  <Button
                    variant="outline"
                    className="w-full border-neutral-200 hover:border-emerald-600 hover:bg-emerald-50 text-neutral-900 hover:text-emerald-800 font-bold text-xs h-10 rounded-xl justify-between group/btn"
                  >
                    <span>Visit Storefront</span>
                    <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
