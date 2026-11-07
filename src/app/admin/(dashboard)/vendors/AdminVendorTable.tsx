"use client";

import * as React from "react";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Search,
  ExternalLink,
  MessageCircle,
  MapPin,
  Clock,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";

interface AdminVendorTableProps {
  initialVendors: any[];
  campuses: any[];
}

export function AdminVendorTable({
  initialVendors,
  campuses,
}: AdminVendorTableProps) {
  const [vendors, setVendors] = React.useState(initialVendors);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [campusFilter, setCampusFilter] = React.useState("all");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [processingId, setProcessingId] = React.useState<string | null>(null);

  const handleUpdateStatus = async (vendorId: string, newStatus: string) => {
    setProcessingId(vendorId);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error("Failed to update vendor status");

      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, status: newStatus } : v))
      );
    } catch (err: any) {
      alert(err.message || "Failed to update vendor status");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredVendors = vendors.filter((v) => {
    const matchesSearch =
      v.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCampus = campusFilter === "all" || v.campusId === campusFilter;
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;

    return matchesSearch && matchesCampus && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <Input
            placeholder="Search vendor or student name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500"
          />
        </div>

        <select
          aria-label="Filter by Campus"
          value={campusFilter}
          onChange={(e) => setCampusFilter(e.target.value)}
          className="flex h-10 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-500"
        >
          <option value="all">All Campuses</option>
          {campuses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-500"
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending Approval</option>
          <option value="APPROVED">Approved & Live</option>
          <option value="REJECTED">Rejected</option>
          <option value="SUSPENDED">Suspended</option>
        </select>
      </div>

      {/* Vendors Table */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-900 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-950/70 border-b border-neutral-800 text-neutral-400 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3 px-4">Store & Student</th>
                <th className="py-3 px-4">Campus & Faculty</th>
                <th className="py-3 px-4">Layout / Contact</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Listings</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredVendors.map((vendor) => (
                <tr key={vendor.id} className="hover:bg-neutral-800/40 transition-colors">
                  {/* Store & Student */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-neutral-800 border border-neutral-700 overflow-hidden shrink-0">
                        {vendor.logo ? (
                          <img
                            src={vendor.logo}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-emerald-400">
                            {vendor.storeName[0]}
                          </div>
                        )}
                      </div>
                      <div className="truncate max-w-[180px]">
                        <p className="font-bold text-white truncate">{vendor.storeName}</p>
                        <p className="text-[11px] text-neutral-400 truncate">
                          {vendor.user.fullName} ({vendor.user.email})
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Campus & Faculty */}
                  <td className="py-3.5 px-4 text-neutral-300">
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                      {vendor.campus?.name.split(" ")[0]}
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {vendor.faculty || "General"}
                    </p>
                  </td>

                  {/* Layout & Contact */}
                  <td className="py-3.5 px-4 text-neutral-300">
                    <Badge variant="secondary" className="text-[10px] uppercase font-bold shrink-0 whitespace-nowrap">
                      {vendor.layout || "grid"}
                    </Badge>
                    <p className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3 shrink-0" />
                      <span className="truncate">{vendor.whatsapp}</span>
                    </p>
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    <Badge
                      variant={
                        vendor.status === "APPROVED"
                          ? "default"
                          : vendor.status === "PENDING"
                          ? "warning"
                          : "destructive"
                      }
                      className="text-[10px] px-2 shrink-0 whitespace-nowrap"
                    >
                      {vendor.status}
                    </Badge>
                  </td>

                  {/* Listings count */}
                  <td className="py-3.5 px-4 text-neutral-300 font-medium">
                    {vendor._count?.products || 0} Products
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {vendor.status !== "APPROVED" && (
                        <Button
                          size="sm"
                          disabled={processingId === vendor.id}
                          onClick={() => handleUpdateStatus(vendor.id, "APPROVED")}
                          className="h-7 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1 px-2.5 rounded-lg"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Approve
                        </Button>
                      )}

                      {vendor.status === "APPROVED" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={processingId === vendor.id}
                          onClick={() => handleUpdateStatus(vendor.id, "SUSPENDED")}
                          className="h-7 text-xs gap-1 px-2.5 rounded-lg"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Suspend
                        </Button>
                      )}

                      {vendor.status === "PENDING" && (
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={processingId === vendor.id}
                          onClick={() => handleUpdateStatus(vendor.id, "REJECTED")}
                          className="h-7 text-xs gap-1 px-2.5 rounded-lg"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          Reject
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
