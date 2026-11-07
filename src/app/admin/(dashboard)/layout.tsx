import Link from "next/link";
import { redirect } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  Layers,
  MapPin,
  ShoppingBag,
  Sliders,
  FileText,
  Activity,
  LogOut,
  ExternalLink,
  ShieldCheck,
  Star,
} from "lucide-react";
import { getSession } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Enforce server-side role check
  if (!session || session.role !== "ADMIN") {
    redirect("/admin/login");
  }

  const navItems = [
    { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
    { label: "Vendors & Approval", href: "/admin/vendors", icon: Users },
    { label: "Product Moderation", href: "/admin/products", icon: Package },
    { label: "Categories", href: "/admin/categories", icon: Layers },
    { label: "Campuses", href: "/admin/campuses", icon: MapPin },
    { label: "Orders Overview", href: "/admin/orders", icon: ShoppingBag },
    { label: "Review Moderation", href: "/admin/reviews", icon: Star },
    { label: "Users & Roles", href: "/admin/users", icon: ShieldCheck },
    { label: "CMS Homepage", href: "/admin/cms/homepage", icon: FileText },
    { label: "Static Pages", href: "/admin/cms/pages", icon: FileText },
    { label: "Platform Settings", href: "/admin/settings", icon: Sliders },
    { label: "Activity Logs", href: "/admin/activity", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row">
      {/* Admin Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-neutral-900 border-r border-neutral-800 p-4 flex flex-col justify-between shrink-0">
        <div className="space-y-6">
          {/* Logo / Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-extrabold shadow-md">
                CT
              </div>
              <div>
                <h2 className="font-extrabold text-base tracking-tight text-white leading-none">
                  Admin <span className="text-emerald-400">CMS</span>
                </h2>
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider">
                  CampusTrade HQ
                </span>
              </div>
            </Link>
            <Badge variant="dark" className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800">
              PROD
            </Badge>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800/80 transition-colors"
                >
                  <Icon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / User Profile & Exit */}
        <div className="pt-4 border-t border-neutral-800 space-y-3">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 flex items-center justify-center text-xs font-bold">
              {session.fullName[0]}
            </div>
            <div className="truncate flex-1">
              <p className="text-xs font-bold text-white truncate">{session.fullName}</p>
              <p className="text-[10px] text-emerald-400 font-semibold">Super Administrator</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <Link
              href="/"
              target="_blank"
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-medium transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Live Site</span>
            </Link>
            <Link
              href="/api/auth/logout"
              className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 font-medium border border-rose-900/50 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Admin Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl">
        {children}
      </main>
    </div>
  );
}
