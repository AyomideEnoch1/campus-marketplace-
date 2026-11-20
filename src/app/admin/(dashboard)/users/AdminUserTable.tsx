"use client";

import { useState } from "react";
import { Search, Shield, User, ShoppingBag, Trash2, Loader2, ArrowLeftRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";

interface UserItem {
  id: string;
  fullName: string;
  email: string;
  phone?: string | null;
  role: string;
  createdAt: string;
  vendorProfile?: {
    storeName: string;
    status: string;
    campus: { name: string };
  } | null;
  _count: {
    orders: number;
    reviews: number;
  };
}

export function AdminUserTable({ initialUsers }: { initialUsers: UserItem[] }) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.phone && u.phone.includes(searchTerm));
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingId(userId);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update role");

      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
      );
      setFeedback({ message: "Role updated successfully", type: "success" });
    } catch (err: any) {
      console.error(err);
      setFeedback({ message: err.message || "Failed to update role", type: "error" });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    const isVendor = Boolean(user.vendorProfile);
    const confirmPrompt = isVendor
      ? `Are you sure you want to permanently delete vendor account "${user.fullName}" (${user.vendorProfile?.storeName})?\n\nThis will remove their storefront, product listings, and account.`
      : `Are you sure you want to delete user "${user.fullName}" (${user.email})? This action cannot be undone.`;

    if (!window.confirm(confirmPrompt)) return;

    setDeletingId(user.id);
    setFeedback(null);
    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to delete user");

      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setFeedback({
        message: data.message || `User ${user.fullName} deleted successfully.`,
        type: "success",
      });
    } catch (err: any) {
      console.error(err);
      setFeedback({ message: err.message || "Failed to delete user", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-purple-950 text-purple-400 border border-purple-800 text-[10px] shrink-0 whitespace-nowrap">Admin</Badge>;
      case "VENDOR":
        return <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px] shrink-0 whitespace-nowrap">Vendor</Badge>;
      default:
        return <Badge variant="outline" className="text-[10px] shrink-0 whitespace-nowrap">Buyer</Badge>;
    }
  };

  const totalUsers = users.length;
  const buyerCount = users.filter((u) => u.role === "BUYER").length;
  const vendorCount = users.filter((u) => u.role === "VENDOR").length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;

  return (
    <div className="space-y-6">
      {/* KPI Stats Header - Total Amount of Users & Role Breakdown */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400 font-medium">Total Registered Users</span>
            <div className="w-8 h-8 rounded-xl bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center">
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-white block">
            {totalUsers.toLocaleString()}
          </span>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            All campus community members
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400 font-medium">Student Buyers</span>
            <div className="w-8 h-8 rounded-xl bg-blue-950/60 border border-blue-800/60 text-blue-400 flex items-center justify-center">
              <User className="w-4 h-4 text-blue-400" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-blue-400 block">
            {buyerCount.toLocaleString()}
          </span>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Active shoppers & students
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400 font-medium">Campus Vendors</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-emerald-400 block">
            {vendorCount.toLocaleString()}
          </span>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Verified sellers with stores
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 sm:p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400 font-medium">Administrators</span>
            <div className="w-8 h-8 rounded-xl bg-purple-950/60 border border-purple-800/60 text-purple-400 flex items-center justify-center">
              <Shield className="w-4 h-4 text-purple-400" />
            </div>
          </div>
          <span className="text-2xl sm:text-3xl font-black text-purple-400 block">
            {adminCount.toLocaleString()}
          </span>
          <span className="text-[11px] text-neutral-500 mt-1 block">
            Platform managers (RBAC)
          </span>
        </div>
      </div>

      {/* Search & Role Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { label: "ALL", count: totalUsers },
            { label: "BUYER", count: buyerCount },
            { label: "VENDOR", count: vendorCount },
            { label: "ADMIN", count: adminCount },
          ].map(({ label, count }) => (
            <button
              key={label}
              onClick={() => setRoleFilter(label)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                roleFilter === label
                  ? "bg-emerald-600 text-white"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              <span>{label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                  roleFilter === label
                    ? "bg-emerald-700 text-white"
                    : "bg-neutral-800 text-neutral-400"
                }`}
              >
                {count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 rounded-xl text-xs flex items-center justify-between ${
            feedback.type === "success"
              ? "bg-emerald-950/80 border border-emerald-800/80 text-emerald-300"
              : "bg-rose-950/80 border border-rose-800/80 text-rose-300"
          }`}
        >
          <span>{feedback.message}</span>
          <button
            onClick={() => setFeedback(null)}
            className="text-[11px] underline opacity-80 hover:opacity-100"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Mobile Swipe Hint */}
      <div className="flex items-center gap-1.5 text-[11px] text-neutral-400 sm:hidden px-1">
        <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
        <span>Swipe horizontally to view all user details & actions</span>
      </div>

      {/* Users Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300 min-w-[760px]">
            <thead className="bg-neutral-950/80 text-neutral-400 font-semibold border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Current Role</th>
                <th className="py-3.5 px-4">Associated Store</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-center">Change Role</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => {
                  const isDeleting = deletingId === u.id;
                  const isChangingRole = loadingId === u.id;

                  return (
                    <tr key={u.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.fullName[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate">{u.fullName}</p>
                            <p className="text-[11px] text-neutral-400 truncate">{u.email}</p>
                            {u.phone && (
                              <p className="text-[10px] text-neutral-500">{u.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {getRoleBadge(u.role)}
                      </td>

                      <td className="py-3.5 px-4">
                        {u.vendorProfile ? (
                          <div>
                            <p className="font-semibold text-white">{u.vendorProfile.storeName}</p>
                            <p className="text-[10px] text-neutral-400">{u.vendorProfile.campus?.name}</p>
                          </div>
                        ) : (
                          <span className="text-neutral-500 text-[11px]">—</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-neutral-400 whitespace-nowrap">
                        {formatDate(u.createdAt)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <select
                          value={u.role}
                          disabled={isChangingRole || isDeleting}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 px-2 py-1 focus:outline-none focus:border-emerald-500 disabled:opacity-50"
                        >
                          <option value="BUYER">Buyer</option>
                          <option value="VENDOR">Vendor</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteUser(u)}
                          disabled={isDeleting || isChangingRole}
                          title="Permanently delete user"
                          className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-rose-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 transition-colors disabled:opacity-40"
                        >
                          {isDeleting ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
