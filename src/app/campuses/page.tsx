import Link from "next/link";
import { GraduationCap, MapPin, Users, Package, ArrowRight, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Campus Locations | CampusTrade",
  description: "Browse verified student sellers, products, and pickup hubs across UNILAG, UI, and OAU.",
};

const campusLogosAndImages: Record<string, { image: string; acronym: string }> = {
  unilag: {
    image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80",
    acronym: "UNILAG",
  },
  ui: {
    image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&q=80",
    acronym: "UI",
  },
  oau: {
    image: "https://images.unsplash.com/photo-1562774053-701939374585?w=800&q=80",
    acronym: "OAU",
  },
};

interface CampusesPageProps {
  searchParams: {
    campus?: string;
  };
}

export default async function CampusesPage({ searchParams }: CampusesPageProps) {
  const selectedSlug = searchParams.campus;

  const where: any = { isActive: true };
  if (selectedSlug && selectedSlug !== "all") {
    where.slug = selectedSlug;
  }

  const campuses = await prisma.campus.findMany({
    where,
    include: {
      vendors: {
        where: { status: "APPROVED" },
        include: {
          _count: { select: { products: true } },
        },
      },
    },
  });

  const allCampuses = await prisma.campus.findMany({ where: { isActive: true } });

  return (
    <div className="min-h-screen bg-neutral-50/60 pb-20">
      {/* Header */}
      <section className="bg-neutral-900 text-white py-14 px-4 border-b border-neutral-800">
        <div className="container mx-auto max-w-4xl text-center space-y-3">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-xs font-bold uppercase tracking-wider">
            Supported Campuses
          </Badge>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight">
            Find Sellers On Your Campus
          </h1>
          <p className="text-sm sm:text-base text-neutral-300 max-w-2xl mx-auto">
            Trade with verified students in your university halls, faculty quads, and campus pickup points with zero shipping delays.
          </p>
        </div>
      </section>

      {/* Campus Filter Bar - Dedicated on the Campuses Page */}
      <div className="border-b border-neutral-200 bg-white sticky top-16 md:top-20 z-20 py-3 shadow-xs">
        <div className="container mx-auto px-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <Link
              href="/campuses"
              className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
                !selectedSlug || selectedSlug === "all"
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
              }`}
            >
              All Campuses ({allCampuses.length})
            </Link>
            {allCampuses.map((c) => {
              const isSelected = selectedSlug === c.slug;
              return (
                <Link
                  key={c.id}
                  href={`/campuses?campus=${c.slug}`}
                  className={`px-3.5 sm:px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors shrink-0 ${
                    isSelected
                      ? "bg-neutral-900 text-white font-bold"
                      : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                  }`}
                >
                  {c.name.split(" ")[0]}
                </Link>
              );
            })}
          </div>

          <span className="text-xs text-neutral-400 hidden sm:inline">
            Showing {campuses.length} Campus {campuses.length === 1 ? "Hub" : "Hubs"}
          </span>
        </div>
      </div>

      {/* Campuses Grid */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {campuses.map((c) => {
            const meta = campusLogosAndImages[c.slug] || {
              image: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=800&q=80",
              acronym: c.name.slice(0, 4).toUpperCase(),
            };

            const totalProducts = c.vendors.reduce(
              (acc, v) => acc + (v._count.products || 0),
              0
            );

            return (
              <div
                key={c.id}
                className="group rounded-3xl bg-white border border-neutral-200/80 overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* University Campus Image */}
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-100">
                    <img
                      src={meta.image}
                      alt={c.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-transparent to-black/20" />
                    <div className="absolute top-4 left-4">
                      <span className="px-2.5 sm:px-3 py-1 rounded-full bg-white/95 backdrop-blur-md text-neutral-900 font-extrabold text-[11px] sm:text-xs shadow-md shrink-0 whitespace-nowrap">
                        {meta.acronym}
                      </span>
                    </div>
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {c.city}
                      </p>
                      <h2 className="text-xl font-extrabold leading-snug line-clamp-1">
                        {c.name}
                      </h2>
                    </div>
                  </div>

                  {/* Campus Info Details */}
                  <div className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 text-center">
                      <div>
                        <span className="text-xs text-neutral-500">Verified Vendors</span>
                        <p className="text-xl font-extrabold text-neutral-900 mt-0.5">
                          {c.vendors.length}
                        </p>
                      </div>
                      <div>
                        <span className="text-xs text-neutral-500">Live Items</span>
                        <p className="text-xl font-extrabold text-emerald-600 mt-0.5">
                          {totalProducts}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-neutral-600">
                      <p className="flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Student ID verification active</span>
                      </p>
                      <p className="flex items-center gap-2">
                        <GraduationCap className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Designated hostel & faculty pickup points</span>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 pt-0">
                  <Link href={`/shop?campus=${c.slug}`} className="block">
                    <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 rounded-xl text-xs h-11 shadow-sm">
                      Browse {meta.acronym} Marketplace <ArrowRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
