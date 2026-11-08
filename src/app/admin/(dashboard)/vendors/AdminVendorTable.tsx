"use client";

import * as React from "react";
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  ExternalLink,
  MessageCircle,
  MapPin,
  Clock,
  GraduationCap,
  Building2,
  ShieldCheck,
  Star,
  FileText,
  UserCheck,
  Eye,
  X,
  Camera,
  AlertCircle,
  Award,
  RefreshCw,
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
  const [sellerTypeFilter, setSellerTypeFilter] = React.useState("all");
  const [processingId, setProcessingId] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = React.useState(false);

  const refreshVendors = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/admin/vendors");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.vendors)) {
          setVendors(data.vendors);
        }
      }
    } catch (err) {
      console.error("Failed to refresh vendors:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  React.useEffect(() => {
    refreshVendors();
  }, []);

  // Inspection modal state
  const [inspectVendor, setInspectVendor] = React.useState<any | null>(null);
  const [rejectionReasonInput, setRejectionReasonInput] = React.useState("");
  const [adminNotesInput, setAdminNotesInput] = React.useState("");
  const [showRejectForm, setShowRejectForm] = React.useState(false);
  const [showRequestInfoForm, setShowRequestInfoForm] = React.useState(false);

  const handleUpdateStatus = async (
    vendorId: string,
    action: string,
    extraData: any = {}
  ) => {
    setProcessingId(vendorId);
    try {
      const res = await fetch(`/api/admin/vendors/${vendorId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extraData }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update vendor status");

      setVendors((prev) =>
        prev.map((v) => (v.id === vendorId ? { ...v, ...data.vendor } : v))
      );

      if (inspectVendor && inspectVendor.id === vendorId) {
        setInspectVendor((prev: any) => ({ ...prev, ...data.vendor }));
      }

      setShowRejectForm(false);
      setShowRequestInfoForm(false);
      setRejectionReasonInput("");
      setAdminNotesInput("");
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
      (v.businessName && v.businessName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      v.user.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCampus = campusFilter === "all" || v.campusId === campusFilter;
    const matchesStatus = statusFilter === "all" || v.status === statusFilter;
    const matchesSellerType =
      sellerTypeFilter === "all" || (v.sellerType || "student") === sellerTypeFilter;

    return matchesSearch && matchesCampus && matchesStatus && matchesSellerType;
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-neutral-400">
          Showing <strong>{filteredVendors.length}</strong> of {vendors.length} vendors
        </p>
        <button
          onClick={refreshVendors}
          disabled={isRefreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs font-semibold border border-neutral-700 transition-colors cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-emerald-400" : ""}`} />
          {isRefreshing ? "Refreshing..." : "Refresh Live Vendors"}
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-neutral-900 border border-neutral-800 text-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <Input
            placeholder="Search vendor, store, or student..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-neutral-950 border-neutral-800 text-white placeholder:text-neutral-500 h-10"
          />
        </div>

        {/* Seller Type Filter */}
        <select
          aria-label="Filter by Seller Type"
          value={sellerTypeFilter}
          onChange={(e) => setSellerTypeFilter(e.target.value)}
          className="flex h-10 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-500"
        >
          <option value="all">All Seller Types</option>
          <option value="student">Student Vendors Only</option>
          <option value="guest">Guest Vendors Only</option>
        </select>

        {/* Campus Filter */}
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

        {/* Status Filter */}
        <select
          aria-label="Filter by Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-xl border border-neutral-800 bg-neutral-950 px-3 py-2 text-white outline-none focus:border-emerald-500"
        >
          <option value="all">All Verification Statuses</option>
          <option value="PENDING">Pending Review</option>
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
                <th className="py-3 px-4">Vendor & Classification</th>
                <th className="py-3 px-4">Campus & Location</th>
                <th className="py-3 px-4">Tier & Payout</th>
                <th className="py-3 px-4">Status & Badges</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4 text-right">Verification Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/80">
              {filteredVendors.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-neutral-500">
                    No vendors found matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredVendors.map((vendor) => {
                  const isGuest = vendor.sellerType === "guest";

                  return (
                    <tr key={vendor.id} className="hover:bg-neutral-800/40 transition-colors">
                      {/* Store & Classification */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-neutral-800 border border-neutral-700 overflow-hidden shrink-0 flex items-center justify-center font-bold text-emerald-400">
                            {vendor.logo ? (
                              <img src={vendor.logo} alt="" className="w-full h-full object-cover" />
                            ) : isGuest ? (
                              <Building2 className="w-5 h-5 text-indigo-400" />
                            ) : (
                              <GraduationCap className="w-5 h-5 text-emerald-400" />
                            )}
                          </div>
                          <div className="truncate max-w-[200px]">
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-white truncate">{vendor.storeName}</p>
                              {vendor.isRegisteredBusiness && (
                                <Badge className="bg-blue-500/20 text-blue-300 border-blue-500/30 text-[9px] py-0 px-1">
                                  CAC
                                </Badge>
                              )}
                              {vendor.isTrustedSeller && (
                                <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[9px] py-0 px-1">
                                  ★
                                </Badge>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400 truncate">
                              {vendor.user.fullName} &bull; {vendor.user.email}
                            </p>
                            <span
                              className={`inline-flex items-center gap-1 text-[10px] font-bold mt-0.5 px-1.5 py-0.5 rounded-md ${
                                isGuest
                                  ? "bg-purple-950/80 text-purple-300 border border-purple-800/60"
                                  : "bg-emerald-950/80 text-emerald-300 border border-emerald-800/60"
                              }`}
                            >
                              {isGuest ? (
                                <>
                                  <Building2 className="w-3 h-3" /> Guest Vendor
                                </>
                              ) : (
                                <>
                                  <GraduationCap className="w-3 h-3" /> Student Vendor
                                </>
                              )}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Campus & Location */}
                      <td className="py-3.5 px-4 text-neutral-300">
                        <p className="font-medium flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                          {vendor.campus?.name.split(" ")[0]}
                        </p>
                        <p className="text-[11px] text-neutral-500 truncate max-w-[150px]">
                          {isGuest
                            ? vendor.businessAddress || vendor.businessCategory || "Off-Campus"
                            : vendor.faculty || "Faculty Not Stated"}
                        </p>
                      </td>

                      {/* Tier & Escrow Payout */}
                      <td className="py-3.5 px-4 text-neutral-300">
                        <Badge variant="secondary" className="text-[10px] uppercase font-bold">
                          Tier {vendor.verificationTier || 1}
                        </Badge>
                        <p className="text-[11px] text-neutral-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-neutral-500" />
                          {vendor.payoutDelayHours || (isGuest ? 72 : 48)}h Payout
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
                          className="text-[10px] px-2"
                        >
                          {vendor.status}
                        </Badge>
                        {vendor.rejectionReason && (
                          <p className="text-[10px] text-rose-400 mt-1 truncate max-w-[120px]" title={vendor.rejectionReason}>
                            {vendor.rejectionReason}
                          </p>
                        )}
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4 text-neutral-300">
                        <a
                          href={`https://wa.me/${vendor.whatsapp?.replace(/[^0-9]/g, "")}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3 shrink-0" />
                          <span className="truncate">{vendor.whatsapp}</span>
                        </a>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 text-right">
                        <Button
                          size="sm"
                          onClick={() => setInspectVendor(vendor)}
                          className="bg-neutral-800 hover:bg-neutral-700 text-white rounded-xl text-xs font-bold gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5 text-emerald-400" />
                          Review Documents
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review & Verification Inspection Modal */}
      {inspectVendor && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 text-neutral-200 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-neutral-800 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-black text-white">
                    {inspectVendor.storeName}
                  </h3>
                  <Badge
                    className={
                      inspectVendor.sellerType === "guest"
                        ? "bg-purple-900 text-purple-200"
                        : "bg-emerald-900 text-emerald-200"
                    }
                  >
                    {inspectVendor.sellerType === "guest" ? "Guest Vendor" : "Student Vendor"}
                  </Badge>
                  <Badge variant="secondary">Tier {inspectVendor.verificationTier || 1}</Badge>
                </div>
                <p className="text-xs text-neutral-400">
                  Applicant: <strong>{inspectVendor.user.fullName}</strong> ({inspectVendor.user.email} &bull; {inspectVendor.whatsapp})
                </p>
              </div>
              <button
                onClick={() => {
                  setInspectVendor(null);
                  setShowRejectForm(false);
                  setShowRequestInfoForm(false);
                }}
                className="w-8 h-8 rounded-full bg-neutral-800 hover:bg-neutral-700 flex items-center justify-center text-neutral-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Verification Documents Review */}
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                  Submitted Verification Artifacts
                </span>
                <span className="text-neutral-500 text-[11px]">
                  Encrypted &bull; NDPA Compliant
                </span>
              </div>

              {inspectVendor.sellerType === "guest" ? (
                /* Guest Vendor Credentials */
                <div className="space-y-4">
                  {/* Business & Location Info */}
                  <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <p className="font-bold text-emerald-400">Business Details</p>
                    <div className="grid grid-cols-2 gap-3 text-neutral-300">
                      <div>
                        <span className="text-neutral-500 block">Category:</span>
                        <strong>{inspectVendor.businessCategory || "General"}</strong>
                      </div>
                      <div>
                        <span className="text-neutral-500 block">Government ID Type:</span>
                        <strong className="uppercase">
                          {inspectVendor.governmentIdType?.replace("_", " ") || "Government ID"}
                        </strong>
                      </div>
                      <div className="col-span-2">
                        <span className="text-neutral-500 block">Physical Address:</span>
                        <span>{inspectVendor.businessAddress || "Not provided"}</span>
                      </div>
                      {inspectVendor.cacNumber && (
                        <div>
                          <span className="text-neutral-500 block">CAC Registration #:</span>
                          <strong className="text-blue-400">{inspectVendor.cacNumber}</strong>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Document Photos Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Government ID */}
                    <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                      <span className="font-bold text-neutral-300 block">
                        Government-Issued ID
                      </span>
                      {inspectVendor.idDocumentPath ? (
                        <a
                          href={inspectVendor.idDocumentPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-video rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden relative group"
                        >
                          <img
                            src={inspectVendor.idDocumentPath}
                            alt="Government ID"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity">
                            View Full Document &rarr;
                          </div>
                        </a>
                      ) : (
                        <div className="p-4 text-center text-neutral-500 bg-neutral-900 rounded-xl">
                          No government ID uploaded
                        </div>
                      )}
                    </div>

                    {/* Selfie with ID */}
                    <div className="space-y-1.5 p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                      <span className="font-bold text-neutral-300 block">
                        Selfie Holding ID
                      </span>
                      {inspectVendor.selfieDocumentPath ? (
                        <a
                          href={inspectVendor.selfieDocumentPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block aspect-video rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden relative group"
                        >
                          <img
                            src={inspectVendor.selfieDocumentPath}
                            alt="Selfie holding ID"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity">
                            View Full Photo &rarr;
                          </div>
                        </a>
                      ) : (
                        <div className="p-4 text-center text-neutral-500 bg-neutral-900 rounded-xl">
                          No selfie uploaded
                        </div>
                      )}
                    </div>

                    {/* Shop Stall Photo (if provided) */}
                    {inspectVendor.businessPhotoPath && (
                      <div className="col-span-1 sm:col-span-2 space-y-1.5 p-3 rounded-2xl bg-neutral-950 border border-neutral-800">
                        <span className="font-bold text-neutral-300 block">
                          Shop / Physical Stall Photo
                        </span>
                        <a
                          href={inspectVendor.businessPhotoPath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block h-40 rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden relative group"
                        >
                          <img
                            src={inspectVendor.businessPhotoPath}
                            alt="Shop photo"
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Student Vendor Credentials */
                <div className="space-y-3">
                  <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800">
                    <p className="font-bold text-emerald-400">Academic Affiliation</p>
                    <p className="text-neutral-300 mt-1">
                      Faculty / Department:{" "}
                      <strong>
                        {inspectVendor.faculty || "Not Stated"} &mdash; {inspectVendor.department || "General"}
                      </strong>
                    </p>
                  </div>

                  <div className="p-3 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-2">
                    <span className="font-bold text-neutral-300 block">
                      Student ID Card Document
                    </span>
                    {inspectVendor.studentIdUrl ? (
                      <a
                        href={inspectVendor.studentIdUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block aspect-video rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden relative group"
                      >
                        <img
                          src={inspectVendor.studentIdUrl}
                          alt="Student ID"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity">
                          View Full Image &rarr;
                        </div>
                      </a>
                    ) : (
                      <div className="p-4 text-center text-neutral-500 bg-neutral-900 rounded-xl">
                        No student ID uploaded (Tier 1 unverified)
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Special Badges Toggle Actions */}
            <div className="p-4 rounded-2xl bg-neutral-950 border border-neutral-800 space-y-3 text-xs">
              <span className="font-bold text-neutral-300 uppercase tracking-wider text-[10px] block">
                Trust & Compliance Badges
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    handleUpdateStatus(inspectVendor.id, "UPDATED", {
                      isTrustedSeller: !inspectVendor.isTrustedSeller,
                      verificationTier: !inspectVendor.isTrustedSeller ? 4 : 2,
                    })
                  }
                  className={`rounded-xl text-xs font-bold gap-1.5 ${
                    inspectVendor.isTrustedSeller
                      ? "border-amber-500 text-amber-400 bg-amber-500/10"
                      : "border-neutral-700 text-neutral-400 hover:text-white"
                  }`}
                >
                  <Star className="w-3.5 h-3.5" />
                  {inspectVendor.isTrustedSeller ? "Trusted Seller (Granted)" : "Grant Trusted Seller"}
                </Button>

                {inspectVendor.sellerType === "guest" && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() =>
                      handleUpdateStatus(inspectVendor.id, "UPDATED", {
                        isRegisteredBusiness: !inspectVendor.isRegisteredBusiness,
                      })
                    }
                    className={`rounded-xl text-xs font-bold gap-1.5 ${
                      inspectVendor.isRegisteredBusiness
                        ? "border-blue-500 text-blue-400 bg-blue-500/10"
                        : "border-neutral-700 text-neutral-400 hover:text-white"
                    }`}
                  >
                    <Award className="w-3.5 h-3.5" />
                    {inspectVendor.isRegisteredBusiness ? "Registered Business (Active)" : "Verify CAC & Grant Badge"}
                  </Button>
                )}
              </div>
            </div>

            {/* Rejection / Request Info Input Forms */}
            {showRejectForm && (
              <div className="p-4 rounded-2xl bg-rose-950/40 border border-rose-900/60 space-y-3 text-xs">
                <span className="font-bold text-rose-300 block">Enter Rejection Reason</span>
                <p className="text-neutral-400 text-[11px]">
                  This reason will be displayed to the vendor and they will be allowed to submit an appeal.
                </p>
                <textarea
                  rows={2}
                  required
                  placeholder="e.g. Blurry government ID photo, or face in selfie does not match ID card..."
                  value={rejectionReasonInput}
                  onChange={(e) => setRejectionReasonInput(e.target.value)}
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-700 p-3 text-xs text-white outline-none focus:border-rose-500"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={!rejectionReasonInput.trim()}
                    onClick={() =>
                      handleUpdateStatus(inspectVendor.id, "REJECT", {
                        rejectionReason: rejectionReasonInput,
                      })
                    }
                    className="bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold"
                  >
                    Confirm Rejection
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowRejectForm(false)}
                    className="text-neutral-400"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {showRequestInfoForm && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-900/60 space-y-3 text-xs">
                <span className="font-bold text-amber-300 block">Request More Identification Info</span>
                <textarea
                  rows={2}
                  required
                  placeholder="Specify what additional documents are needed (e.g. utility bill for stall, clearer selfie)..."
                  value={adminNotesInput}
                  onChange={(e) => setAdminNotesInput(e.target.value)}
                  className="w-full rounded-xl bg-neutral-900 border border-neutral-700 p-3 text-xs text-white outline-none focus:border-amber-500"
                />
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    disabled={!adminNotesInput.trim()}
                    onClick={() =>
                      handleUpdateStatus(inspectVendor.id, "REQUEST_MORE_INFO", {
                        adminNotes: adminNotesInput,
                        rejectionReason: adminNotesInput,
                      })
                    }
                    className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold"
                  >
                    Send Request to Vendor
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setShowRequestInfoForm(false)}
                    className="text-neutral-400"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            {/* Moderation Actions Footer */}
            <div className="pt-4 border-t border-neutral-800 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  disabled={processingId === inspectVendor.id}
                  onClick={() => setShowRequestInfoForm(true)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-amber-900/50 rounded-xl text-xs font-bold"
                >
                  Request More Info
                </Button>

                <Button
                  size="sm"
                  disabled={processingId === inspectVendor.id}
                  onClick={() => setShowRejectForm(true)}
                  className="bg-neutral-800 hover:bg-neutral-700 text-rose-400 border border-rose-900/50 rounded-xl text-xs font-bold"
                >
                  Reject Application
                </Button>

                {inspectVendor.status === "APPROVED" && (
                  <Button
                    size="sm"
                    disabled={processingId === inspectVendor.id}
                    onClick={() => handleUpdateStatus(inspectVendor.id, "SUSPEND")}
                    className="bg-rose-950/70 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-xl text-xs font-bold"
                  >
                    Suspend Vendor
                  </Button>
                )}
              </div>

              <Button
                size="sm"
                disabled={processingId === inspectVendor.id || inspectVendor.status === "APPROVED"}
                onClick={() => handleUpdateStatus(inspectVendor.id, "APPROVE")}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-6 h-10 shadow-md shadow-emerald-600/30 gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                Approve & Activate Vendor
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
