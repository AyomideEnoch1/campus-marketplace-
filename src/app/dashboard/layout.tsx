export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VendorSidebar } from "@/components/vendor/VendorSidebar";
import { VendorDashboardMain } from "@/components/vendor/VendorDashboardMain";

export default async function VendorDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login?redirect=/dashboard");
  }

  // Fetch full vendor profile
  const vendor = await prisma.vendorProfile.findUnique({
    where: { userId: session.id },
    include: { campus: true },
  });

  if (!vendor) {
    redirect("/auth/register?role=vendor");
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row text-neutral-900">
      {/* Collapsible Left Sidebar */}
      <VendorSidebar vendor={vendor} session={session} />

      {/* Main Vendor Content Area */}
      <VendorDashboardMain>{children}</VendorDashboardMain>
    </div>
  );
}
