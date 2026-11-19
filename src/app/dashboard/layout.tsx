export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { VendorSidebar } from "@/components/vendor/VendorSidebar";

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
    redirect("/vendor/register");
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col md:flex-row text-neutral-900">
      {/* Collapsible Left Sidebar */}
      <VendorSidebar vendor={vendor} session={session} />

      {/* Main Vendor Content Area */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-6xl">
        {children}
      </main>
    </div>
  );
}
