"use client";

import { useState } from "react";
import { Search, Shield, User, ShoppingBag, Store } from "lucide-react";
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

  const filtered = users.filter((u) => {
    const matchesSearch =
      u.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleRoleChange = async (userId: string, newRole: string) => {
    setLoadingId(userId);
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });
      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <Badge className="bg-purple-950 text-purple-400 border border-purple-800">Admin</Badge>;
      case "VENDOR":
        return <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800">Vendor</Badge>;
      default:
        return <Badge variant="outline">Buyer</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Role Filter */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "ADMIN", "VENDOR", "BUYER"].map((role) => (
            <button
              key={role}
              onClick={() => setRoleFilter(role)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                roleFilter === role
                  ? "bg-emerald-600 text-white"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {role}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/60 text-neutral-400 font-semibold border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">User</th>
                <th className="py-3 px-4">Current Role</th>
                <th className="py-3 px-4">Associated Store</th>
                <th className="py-3 px-4">Joined Date</th>
                <th className="py-3 px-4 text-right">Assign Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-500">
                    No users matching criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((u) => (
                  <tr key={u.id} className="hover:bg-neutral-800/40 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-neutral-800 border border-neutral-700 text-neutral-300 flex items-center justify-center font-bold text-xs">
                          {u.fullName[0]}
                        </div>
                        <div>
                          <p className="font-bold text-white">{u.fullName}</p>
                          <p className="text-[11px] text-neutral-400">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      {getRoleBadge(u.role)}
                    </td>

                    <td className="py-3 px-4">
                      {u.vendorProfile ? (
                        <div>
                          <p className="font-semibold text-white">{u.vendorProfile.storeName}</p>
                          <p className="text-[10px] text-neutral-400">{u.vendorProfile.campus.name}</p>
                        </div>
                      ) : (
                        <span className="text-neutral-500 text-[11px]">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-neutral-400">
                      {formatDate(u.createdAt)}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <select
                        value={u.role}
                        disabled={loadingId === u.id}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-neutral-950 border border-neutral-800 rounded-lg text-xs text-neutral-200 px-2 py-1 focus:outline-none focus:border-emerald-500"
                      >
                        <option value="BUYER">Buyer</option>
                        <option value="VENDOR">Vendor</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
