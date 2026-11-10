"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  GraduationCap,
  Store,
  ShieldCheck,
  Building2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Camera,
  MapPin,
  Clock,
  Sparkles,
  ArrowRight,
  Info,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SingleImageUpload } from "@/components/ui/single-image-upload";

interface CampusData {
  id: string;
  name: string;
  slug: string;
  city: string;
  settings?: {
    guestVendorsEnabled: boolean;
    guestVendorCap: number;
  } | null;
  safeMeetupPoints?: {
    id: string;
    name: string;
    description?: string | null;
  }[];
  _count?: {
    vendors: number;
  };
}

interface VendorRegisterClientProps {
  campuses: CampusData[];
}

export function VendorRegisterClient({ campuses }: VendorRegisterClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Seller Type: 'student' | 'guest'
  const initialType = searchParams.get("type") === "guest" ? "guest" : "student";
  const [sellerType, setSellerType] = React.useState<"student" | "guest">(initialType);

  // Common User Credentials
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");
  const [whatsapp, setWhatsapp] = React.useState("");
  const [campusId, setCampusId] = React.useState(campuses[0]?.id || "");

  React.useEffect(() => {
    if (!campusId && campuses.length > 0) {
      setCampusId(campuses[0].id);
    }
  }, [campuses, campusId]);
  const [storeName, setStoreName] = React.useState("");
  const [storeDescription, setStoreDescription] = React.useState("");

  // Student Vendor Fields
  const [faculty, setFaculty] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [studentIdUrl, setStudentIdUrl] = React.useState("");

  // Guest Vendor Fields
  const [businessName, setBusinessName] = React.useState("");
  const [businessCategory, setBusinessCategory] = React.useState("Fashion & Apparel");
  const [businessAddress, setBusinessAddress] = React.useState("");
  const [businessPhotoPath, setBusinessPhotoPath] = React.useState("");
  const [governmentIdType, setGovernmentIdType] = React.useState<
    "voters_card" | "drivers_license" | "international_passport" | "school_work_id"
  >("voters_card");
  const [governmentIdNumber, setGovernmentIdNumber] = React.useState("");
  const [idDocumentPath, setIdDocumentPath] = React.useState("");
  const [selfieDocumentPath, setSelfieDocumentPath] = React.useState("");
  const [cacNumber, setCacNumber] = React.useState("");
  const [cacDocumentPath, setCacDocumentPath] = React.useState("");
  const [voucherCode, setVoucherCode] = React.useState("");

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Selected campus details
  const selectedCampus = campuses.find((c) => c.id === campusId);
  const guestVendorsEnabled = selectedCampus?.settings ? selectedCampus.settings.guestVendorsEnabled : true;
  const guestVendorCap = selectedCampus?.settings ? selectedCampus.settings.guestVendorCap : 50;
  const currentGuestCount = selectedCampus?._count?.vendors || 0;
  const isCapReached = currentGuestCount >= guestVendorCap;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Validate Guest specifics
    if (sellerType === "guest") {
      if (!guestVendorsEnabled) {
        setError(`Guest registration is temporarily disabled on ${selectedCampus?.name || "this campus"}. Only verified students can sell.`);
        setLoading(false);
        return;
      }

      if (!idDocumentPath || !selfieDocumentPath) {
        setError("Please upload your government-issued ID and selfie holding your ID for Tier 2 verification.");
        setLoading(false);
        return;
      }
    }

    try {
      const payload: any = {
        fullName,
        email: email || undefined,
        password,
        phone,
        whatsapp: whatsapp || phone,
        role: "VENDOR",
        sellerType,
        storeName: storeName || businessName,
        campusId,
        storeDescription,
      };

      if (sellerType === "student") {
        payload.faculty = faculty;
        payload.department = department;
        payload.studentIdUrl = studentIdUrl || undefined;
      } else {
        payload.businessName = businessName || storeName;
        payload.businessCategory = businessCategory;
        payload.businessAddress = businessAddress;
        payload.businessPhotoPath = businessPhotoPath || undefined;
        payload.governmentIdType = governmentIdType;
        payload.governmentIdNumber = governmentIdNumber;
        payload.idDocumentPath = idDocumentPath;
        payload.selfieDocumentPath = selfieDocumentPath;
        payload.cacNumber = cacNumber || undefined;
        payload.cacDocumentPath = cacDocumentPath || undefined;
        payload.vouchedBy = voucherCode || undefined;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to register vendor account");
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50/70 py-10 sm:py-16 px-4">
      <div className="container mx-auto max-w-3xl space-y-8">
        {/* Top Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <Store className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-neutral-900">
              Campus<span className="text-emerald-600">Trade</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black text-neutral-950 tracking-tight">
            Vendor Onboarding & Verification
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-lg mx-auto">
            Sell directly to thousands of Nigerian university students. Choose your seller classification to begin.
          </p>
        </div>

        {/* Seller Type Selector Tabs */}
        <div className="bg-white rounded-3xl border border-neutral-200/80 p-3 sm:p-4 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Student Vendor Option */}
            <button
              type="button"
              onClick={() => {
                setSellerType("student");
                setError(null);
              }}
              className={`p-4 rounded-2xl text-left border-2 transition-all relative flex flex-col justify-between ${
                sellerType === "student"
                  ? "border-emerald-600 bg-emerald-50/60 shadow-xs"
                  : "border-neutral-200 hover:border-neutral-300 bg-neutral-50/40"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    sellerType === "student"
                      ? "bg-emerald-600 text-white"
                      : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  <GraduationCap className="w-5 h-5" />
                </div>
                <Badge
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    sellerType === "student"
                      ? "bg-emerald-600 text-white"
                      : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  Student Vendor
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-neutral-900">
                  Current Campus Student
                </p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Undergraduates & postgraduates selling textbooks, tech, thrift, or hostel services.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-emerald-200/60 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                48h escrow payout &bull; Student verified badge
              </div>
            </button>

            {/* Guest Vendor Option */}
            <button
              type="button"
              onClick={() => {
                setSellerType("guest");
                setError(null);
              }}
              className={`p-4 rounded-2xl text-left border-2 transition-all relative flex flex-col justify-between ${
                sellerType === "guest"
                  ? "border-emerald-600 bg-emerald-50/60 shadow-xs"
                  : "border-neutral-200 hover:border-neutral-300 bg-neutral-50/40"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    sellerType === "guest"
                      ? "bg-emerald-600 text-white"
                      : "bg-neutral-200 text-neutral-600"
                  }`}
                >
                  <Building2 className="w-5 h-5" />
                </div>
                <Badge
                  className={`text-[10px] font-bold uppercase tracking-wider ${
                    sellerType === "guest"
                      ? "bg-emerald-600 text-white"
                      : "bg-neutral-200 text-neutral-700"
                  }`}
                >
                  Guest Vendor
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-neutral-900">
                  Off-Campus Trader / Business
                </p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Alumni, staff, off-campus store owners & registered campus area businesses.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-emerald-200/60 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Safe meetup points &bull; Government ID review
              </div>
            </button>
          </div>
        </div>

        {/* Guest Warning / Info Alert */}
        {sellerType === "guest" && (
          <div className="rounded-2xl bg-amber-50/80 border border-amber-200 p-4 text-xs text-amber-950 space-y-1.5">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <ShieldCheck className="w-4 h-4 text-amber-700" />
              Guest Vendor Safeguards & Verification Protocol
            </div>
            <ul className="list-disc pl-4 space-y-1 text-amber-800 leading-relaxed">
              <li>
                <strong>Tier 1 (Instant):</strong> Phone OTP verification allows up to 3 listings with ₦10,000 order cap.
              </li>
              <li>
                <strong>Tier 2 (Within 24 Hours):</strong> Admin manual review of Government ID + Selfie + Business location.
              </li>
              <li>
                <strong>Designated Meetups:</strong> All campus orders are delivered at verified campus safe meetup points chosen by buyers at checkout.
              </li>
              <li>
                <strong>Payout Window:</strong> 72-hour escrow release period (shortens as you earn trust).
              </li>
            </ul>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-neutral-200/80 p-6 sm:p-10 shadow-sm space-y-8">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h2 className="text-base font-bold text-neutral-900">
                1. Account Credentials & Campus
              </h2>
              <p className="text-xs text-neutral-500">Your login credentials and primary university market</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">Full Name *</label>
                <Input
                  required
                  placeholder="e.g. Samuel Adekunle"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="rounded-xl text-xs h-10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">
                  Phone Number (WhatsApp) *
                </label>
                <Input
                  type="tel"
                  required
                  placeholder="e.g. 08012345678"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (!whatsapp) setWhatsapp(e.target.value);
                  }}
                  className="rounded-xl text-xs h-10"
                />
                <span className="text-[10px] text-neutral-400">Used for customer communication & meetup alerts</span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">
                  Email Address {sellerType === "guest" ? "(Optional)" : "*"}
                </label>
                <Input
                  type="email"
                  required={sellerType === "student"}
                  placeholder={
                    sellerType === "student"
                      ? "student@unilag.edu.ng"
                      : "business@email.com (optional)"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl text-xs h-10"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">Create Password *</label>
                <Input
                  type="password"
                  required
                  placeholder="Minimum 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl text-xs h-10"
                />
              </div>
            </div>

            {/* Campus Selection */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Select Target Campus *</label>
              <select
                aria-label="Target University Campus"
                value={campusId}
                onChange={(e) => setCampusId(e.target.value)}
                className="flex h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-600"
              >
                {campuses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} &mdash; {c.city}
                  </option>
                ))}
              </select>

              {sellerType === "guest" && (
                <div className="mt-1 text-[11px] text-neutral-500">
                  {!guestVendorsEnabled ? (
                    <span className="text-rose-600 font-semibold flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" /> Guest vendors are currently disabled on this campus.
                    </span>
                  ) : (
                    <span className="text-emerald-700 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Guest vendors accepted ({currentGuestCount} / {guestVendorCap} active slots taken).
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Store / Business Information */}
          <div className="space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h2 className="text-base font-bold text-neutral-900">
                2. Storefront Information
              </h2>
              <p className="text-xs text-neutral-500">How buyers will discover your store</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">
                  {sellerType === "guest" ? "Business / Trade Name *" : "Store Name *"}
                </label>
                <Input
                  required
                  placeholder={sellerType === "guest" ? "e.g. Apex Tech Gadgets" : "e.g. Demilade Thrift Hub"}
                  value={sellerType === "guest" ? businessName : storeName}
                  onChange={(e) => {
                    if (sellerType === "guest") {
                      setBusinessName(e.target.value);
                      setStoreName(e.target.value);
                    } else {
                      setStoreName(e.target.value);
                    }
                  }}
                  className="rounded-xl text-xs h-10"
                />
              </div>

              {sellerType === "guest" ? (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Category of Goods *</label>
                  <select
                    aria-label="Category of Goods"
                    value={businessCategory}
                    onChange={(e) => setBusinessCategory(e.target.value)}
                    className="flex h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-600"
                  >
                    <option value="Fashion & Apparel">Fashion & Apparel</option>
                    <option value="Electronics & Gadgets">Electronics & Gadgets</option>
                    <option value="Food & Groceries">Food & Groceries</option>
                    <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                    <option value="Hostel & Living Essentials">Hostel & Living Essentials</option>
                    <option value="Campus Services">Campus Services</option>
                    <option value="Books & Academics">Books & Academics</option>
                  </select>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">Faculty & Department</label>
                  <Input
                    placeholder="e.g. Engineering, Mechanical"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-neutral-700">Storefront Bio</label>
              <textarea
                rows={2}
                placeholder="Briefly describe what you sell to students..."
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 p-3 text-xs outline-none focus:border-emerald-600"
              />
            </div>

            {sellerType === "guest" && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-neutral-700">
                  Shop Physical Address / Campus Operating Area *
                </label>
                <Input
                  required
                  placeholder="e.g. Shop 4, Commercial Hub Beside Unilag Back Gate, Akoka"
                  value={businessAddress}
                  onChange={(e) => setBusinessAddress(e.target.value)}
                  className="rounded-xl text-xs h-10"
                />
              </div>
            )}
          </div>

          {/* Section 3: Verification Documents */}
          <div className="space-y-6">
            <div className="border-b border-neutral-100 pb-3">
              <h2 className="text-base font-bold text-neutral-900">
                3. Identity & Verification Documents
              </h2>
              <p className="text-xs text-neutral-500">
                Protected and encrypted in compliance with NDPA guidelines. Only platform administrators can inspect review documents.
              </p>
            </div>

            {sellerType === "student" ? (
              /* Student Verification */
              <div className="space-y-3">
                <label className="text-xs font-bold text-neutral-700 block">
                  Student ID Card Photo (Optional for Tier 1, Required for Tier 2)
                </label>
                <SingleImageUpload
                  value={studentIdUrl}
                  onChange={setStudentIdUrl}
                  folder="stores"
                  label="Upload Student ID Card"
                  hint="Provide a clear photo of your current university student identity card"
                />
              </div>
            ) : (
              /* Guest Verification (Government ID, Selfie, Shop Photo, Optional CAC) */
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">Government ID Type *</label>
                    <select
                      aria-label="Government ID Type"
                      value={governmentIdType}
                      onChange={(e: any) => setGovernmentIdType(e.target.value)}
                      className="flex h-10 w-full rounded-xl border border-neutral-300 bg-white px-3 py-2 text-xs outline-none focus:border-emerald-600"
                    >
                      <option value="voters_card">National Voter&apos;s Card (INEC)</option>
                      <option value="drivers_license">FRSC Driver&apos;s License</option>
                      <option value="international_passport">International Passport</option>
                      <option value="school_work_id">Official Institution / Staff / Work ID</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-neutral-700">
                      Government ID Number *
                    </label>
                    <Input
                      required
                      placeholder="e.g. VIN / License / Passport Number"
                      value={governmentIdNumber}
                      onChange={(e) => setGovernmentIdNumber(e.target.value)}
                      className="rounded-xl text-xs h-10"
                    />
                    <span className="text-[10px] text-neutral-400">
                      Hashed cryptographically for duplicate detection; never stored in plaintext.
                    </span>
                  </div>
                </div>

                {/* ID Photo & Selfie Uploads */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-700 block">
                      1. Government ID Photo *
                    </label>
                    <SingleImageUpload
                      value={idDocumentPath}
                      onChange={setIdDocumentPath}
                      folder="stores"
                      label="Upload ID Document"
                      hint="Clear photo of the front of your government ID card"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-neutral-700 block">
                      2. Selfie Holding Your ID *
                    </label>
                    <SingleImageUpload
                      value={selfieDocumentPath}
                      onChange={setSelfieDocumentPath}
                      folder="stores"
                      label="Upload Selfie with ID"
                      hint="Hold your ID card next to your face in a well-lit area"
                    />
                  </div>
                </div>

                {/* Shop Photo */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-neutral-700 block">
                    Shop / Stall Photo (Optional)
                  </label>
                  <SingleImageUpload
                    value={businessPhotoPath}
                    onChange={setBusinessPhotoPath}
                    folder="stores"
                    label="Upload Shop / Storefront Photo"
                    hint="A photo of your stall, physical shop, or inventory"
                  />
                </div>

                {/* CAC Registration (Optional) */}
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <span className="text-xs font-bold text-neutral-900">
                      Registered Business Verification (Optional)
                    </span>
                    <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">
                      Grants &quot;Registered Business&quot; Badge
                    </Badge>
                  </div>
                  <p className="text-xs text-neutral-500">
                    If your business is registered with the Corporate Affairs Commission (CAC), provide your RC/BN number to receive a verified business checkmark.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      placeholder="e.g. RC 1234567 or BN 987654"
                      value={cacNumber}
                      onChange={(e) => setCacNumber(e.target.value)}
                      className="rounded-xl text-xs h-10 bg-white"
                    />
                    <Input
                      placeholder="CAC Document URL or certificate reference"
                      value={cacDocumentPath}
                      onChange={(e) => setCacDocumentPath(e.target.value)}
                      className="rounded-xl text-xs h-10 bg-white"
                    />
                  </div>
                </div>

                {/* Vouching by Trusted Seller (Optional) */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-neutral-700">
                    Trusted Seller Voucher ID (Optional)
                  </label>
                  <Input
                    placeholder="User ID or store code of an existing Trusted Seller who vouches for you"
                    value={voucherCode}
                    onChange={(e) => setVoucherCode(e.target.value)}
                    className="rounded-xl text-xs h-10"
                  />
                  <span className="text-[10px] text-neutral-400">
                    If vouched, your account gains expedited trust; note that upheld scam reports will impact both parties.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Submit Button */}
          <div className="pt-4 border-t border-neutral-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-xs text-neutral-500">
              By registering, you agree to the{" "}
              <Link href="/vendor-guidelines" className="text-emerald-600 font-bold hover:underline">
                Seller Code of Conduct
              </Link>{" "}
              and Escrow terms.
            </p>

            <Button
              type="submit"
              disabled={loading || (sellerType === "guest" && !guestVendorsEnabled)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-8 h-11 shadow-md shadow-emerald-600/20"
            >
              {loading ? "Verifying & Creating Store..." : `Complete ${sellerType === "guest" ? "Guest" : "Student"} Registration`}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
