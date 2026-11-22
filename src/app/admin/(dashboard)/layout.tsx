import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // Enforce server-side role check
  if (!session || (session.role !== "ADMIN" && session.role !== "SUPERADMIN")) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col md:flex-row">
      {/* Collapsible Left Admin Sidebar */}
      <AdminSidebar session={session} />

      {/* Main Admin Content Area */}
      <main className="flex-1 p-3.5 sm:p-6 md:p-10 overflow-y-auto max-w-7xl min-w-0">
        {children}
      </main>
    </div>
  );
}
