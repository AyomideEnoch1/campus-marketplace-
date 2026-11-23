"use client";

import { useState } from "react";
import {
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  User,
  ShoppingBag,
  Trash2,
  Loader2,
  ArrowLeftRight,
  Users,
  Lock,
} from "lucide-react";
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

interface AdminUserTableProps {
  initialUsers: UserItem[];
  currentAdminRole?: string;
  currentAdminId?: string;
}

export function AdminUserTable({
  initialUsers,
  currentAdminRole,
  currentAdminId,
}: AdminUserTableProps) {
  const [users, setUsers] = useState(initialUsers);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const isSuperAdmin = currentAdminRole === "SUPERADMIN";

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
      setFeedback({ message: `Role updated to ${newRole} successfully`, type: "success" });
    } catch (err: any) {
      console.error(err);
      setFeedback({ message: err.message || "Failed to update role", type: "error" });
    } finally {
      setLoadingId(null);
    }
  };

  const handleDeleteUser = async (user: UserItem) => {
    if (!isSuperAdmin) {
      setFeedback({
        message: "Forbidden: Only Super Administrators can delete users completely.",
        type: "error",
      });
      return;
    }

    const isSelf = user.id === currentAdminId;
    if (isSelf) {
      alert("You cannot delete your own Super Administrator account.");
      return;
    }

    const isVendor = Boolean(user.vendorProfile);
    const confirmPrompt = isVendor
      ? `PERMANENT DELETION WARNING (Superadmin Action):\n\nAre you sure you want to completely delete vendor account "${user.fullName}" (${user.vendorProfile?.storeName} / ${user.email})?\n\nThis will permanently delete this user, their storefront, all product listings, review history, and unbind orders. This action CANNOT be undone.`
      : `PERMANENT DELETION WARNING (Superadmin Action):\n\nAre you sure you want to completely delete user "${user.fullName}" (${user.email} - ${user.role})?\n\nThis will completely wipe this user account and all associated activity from the system. This action CANNOT be undone.`;

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
        message: data.message || `User ${user.fullName} and all records deleted completely.`,
        type: "success",
      });
    } catch (err: any) {
      console.error(err);
      setFeedback({ message: err.message || "Failed to delete user completely", type: "error" });
    } finally {
      setDeletingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    const r = (role || "").toUpperCase();
    switch (r) {
      case "SUPERADMIN":
        return (
          <span className="inline-flex items-center justify-center gap-1.5 w-28 py-1 px-2.5 rounded-full text-[11px] font-bold tracking-wide bg-amber-500/15 text-amber-300 border border-amber-500/30 shadow-xs shadow-amber-950/40 select-none">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Super Admin</span>
          </span>
        );
      case "ADMIN":
        return (
          <span className="inline-flex items-center justify-center gap-1.5 w-28 py-1 px-2.5 rounded-full text-[11px] font-bold tracking-wide bg-purple-500/15 text-purple-300 border border-purple-500/30 shadow-xs shadow-purple-950/40 select-none">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span className="truncate">Admin</span>
          </span>
        );
      case "VENDOR":
        return (
          <span className="inline-flex items-center justify-center gap-1.5 w-28 py-1 px-2.5 rounded-full text-[11px] font-bold tracking-wide bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-xs shadow-emerald-950/40 select-none">
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Vendor</span>
          </span>
        );
      case "BUYER":
      default:
        return (
          <span className="inline-flex items-center justify-center gap-1.5 w-28 py-1 px-2.5 rounded-full text-[11px] font-bold tracking-wide bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-xs shadow-blue-950/40 select-none">
            <User className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span className="truncate">Buyer</span>
          </span>
        );
    }
  };

  const totalUsers = users.length;
  const buyerCount = users.filter((u) => u.role === "BUYER").length;
  const vendorCount = users.filter((u) => u.role === "VENDOR").length;
  const adminCount = users.filter((u) => u.role === "ADMIN").length;
  const superAdminCount = users.filter((u) => u.role === "SUPERADMIN").length;

  return (
    <div className="space-y-6">
      {/* Superadmin Indicator Notice */}
      <div className="flex items-center justify-between bg-neutral-900 border border-neutral-800 rounded-2xl p-4">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
              isSuperAdmin
                ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                : "bg-purple-500/20 text-purple-400 border border-purple-500/30"
            }`}
          >
            {isSuperAdmin ? <ShieldAlert className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-white">Your Access Level:</span>
              <span
                className={`text-xs font-black uppercase tracking-wider ${
                  isSuperAdmin ? "text-amber-400" : "text-purple-400"
                }`}
              >
                {isSuperAdmin ? "Super Administrator" : "Administrator"}
              </span>
            </div>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              {isSuperAdmin
                ? "Full control: You have authority to assign any role and permanently delete user accounts completely."
                : "Standard Admin: You can view and manage user roles (Buyer, Vendor, Admin). Only Superadmins can delete users completely."}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Stats Header - Total Amount of Users & Role Breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-neutral-400 font-medium">Total Users</span>
            <div className="w-7 h-7 rounded-lg bg-neutral-800 border border-neutral-700 text-white flex items-center justify-center">
              <Users className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-black text-white block">
            {totalUsers.toLocaleString()}
          </span>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">
            All registered members
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-neutral-400 font-medium">Student Buyers</span>
            <div className="w-7 h-7 rounded-lg bg-blue-950/60 border border-blue-800/60 text-blue-400 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-blue-400" />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-black text-blue-400 block">
            {buyerCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">
            Campus shoppers
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-neutral-400 font-medium">Vendors</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
              <ShoppingBag className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-black text-emerald-400 block">
            {vendorCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">
            Verified store owners
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-neutral-400 font-medium">Admins</span>
            <div className="w-7 h-7 rounded-lg bg-purple-950/60 border border-purple-800/60 text-purple-400 flex items-center justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-black text-purple-400 block">
            {adminCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">
            Platform moderators
          </span>
        </div>

        <div className="bg-neutral-900 border border-neutral-800 p-4 rounded-2xl">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs text-neutral-400 font-medium">Super Admins</span>
            <div className="w-7 h-7 rounded-lg bg-amber-950/60 border border-amber-800/60 text-amber-400 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-black text-amber-400 block">
            {superAdminCount.toLocaleString()}
          </span>
          <span className="text-[10px] text-neutral-500 mt-0.5 block">
            Root access controllers
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
            { label: "SUPERADMIN", count: superAdminCount },
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
              <span>{label === "SUPERADMIN" ? "SUPER ADMIN" : label}</span>
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
          <table className="w-full text-left text-xs text-neutral-300 min-w-[780px]">
            <thead className="bg-neutral-950/80 text-neutral-400 font-semibold border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4 text-center">Current Role</th>
                <th className="py-3.5 px-4">Associated Store</th>
                <th className="py-3.5 px-4">Joined Date</th>
                <th className="py-3.5 px-4 text-center">Change Role</th>
                <th className="py-3.5 px-4 text-right">Delete (Superadmin)</th>
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
                  const isTargetSuperAdmin = u.role === "SUPERADMIN";
                  const isSelf = u.id === currentAdminId;

                  // Admin cannot edit a Superadmin unless the current admin is also a Superadmin
                  const canEditThisUserRole = isSuperAdmin || !isTargetSuperAdmin;

                  return (
                    <tr key={u.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center font-bold text-xs shrink-0">
                            {u.fullName[0]?.toUpperCase() || "U"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-white truncate flex items-center gap-1.5">
                              {u.fullName}
                              {isSelf && (
                                <span className="text-[9px] bg-neutral-800 text-emerald-400 border border-neutral-700 px-1.5 py-0.2 rounded-full font-mono">
                                  You
                                </span>
                              )}
                            </p>
                            <p className="text-[11px] text-neutral-400 truncate">{u.email}</p>
                            {u.phone && (
                              <p className="text-[10px] text-neutral-500">{u.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex justify-center">
                          {getRoleBadge(u.role)}
                        </div>
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
                          disabled={isChangingRole || isDeleting || !canEditThisUserRole}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 px-2 py-1 focus:outline-none focus:border-emerald-500 disabled:opacity-40 disabled:cursor-not-allowed"
                          title={
                            !canEditThisUserRole
                              ? "Only Super Administrators can modify Super Administrator accounts"
                              : "Change user role"
                          }
                        >
                          <option value="BUYER">Buyer</option>
                          <option value="VENDOR">Vendor</option>
                          <option value="ADMIN">Admin</option>
                          {isSuperAdmin && (
                            <option value="SUPERADMIN">Super Admin</option>
                          )}
                        </select>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {isSuperAdmin ? (
                          <button
                            onClick={() => handleDeleteUser(u)}
                            disabled={isDeleting || isChangingRole || isSelf}
                            title={
                              isSelf
                                ? "You cannot delete your own Super Administrator account"
                                : "Permanently delete user and all associated records completely"
                            }
                            className="p-1.5 rounded-lg bg-neutral-950 border border-neutral-800 hover:border-rose-800 hover:bg-rose-950/60 text-neutral-400 hover:text-rose-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed inline-flex items-center gap-1 text-[11px]"
                          >
                            {isDeleting ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-400" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                            <span className="hidden sm:inline">Delete completely</span>
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 text-[10px] text-neutral-500 bg-neutral-950/60 border border-neutral-800/60 px-2 py-1 rounded-lg cursor-not-allowed opacity-60"
                            title="Only Super Administrators can delete users"
                          >
                            <Lock className="w-3 h-3 text-neutral-600" />
                            Superadmin only
                          </span>
                        )}
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
