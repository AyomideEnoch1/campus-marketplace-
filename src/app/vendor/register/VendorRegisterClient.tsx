"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingCart,
  GraduationCap,
  ShoppingBag,
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
  ExternalLink,
  X,
  MessageCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SingleImageUpload } from "@/components/ui/single-image-upload";
import { Eye, EyeOff } from "lucide-react";
import { formatNigerianPhone, cleanPhoneNumber } from "@/lib/utils";
import { PasswordStrengthGauge } from "@/components/ui/PasswordStrengthGauge";

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
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [phone, setPhone] = React.useState("+234 ");
  const [whatsapp, setWhatsapp] = React.useState("+234 ");
  const [campusId, setCampusId] = React.useState(campuses[0]?.id || "");

  // Ambassador Referral Code
  const [referralCode, setReferralCode] = React.useState<string>("");

  React.useEffect(() => {
    const urlRef = searchParams.get("ref") || searchParams.get("ambassador");
    if (urlRef) {
      setReferralCode(urlRef.trim().toUpperCase());
    } else {
      const stored = localStorage.getItem("campus_ref");
      if (stored) setReferralCode(stored.trim().toUpperCase());
    }
  }, [searchParams]);

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
  const [showCodeOfConductModal, setShowCodeOfConductModal] = React.useState(false);

  // Restore draft from sessionStorage if user previously filled part of the form
  React.useEffect(() => {
    try {
      const saved = sessionStorage.getItem("ct_vendor_form_draft");
      if (saved) {
        const d = JSON.parse(saved);
        if (d.fullName) setFullName(d.fullName);
        if (d.email) setEmail(d.email);
        if (d.phone) setPhone(d.phone);
        if (d.whatsapp) setWhatsapp(d.whatsapp);
        if (d.campusId) setCampusId(d.campusId);
        if (d.storeName) setStoreName(d.storeName);
        if (d.storeDescription) setStoreDescription(d.storeDescription);
        if (d.faculty) setFaculty(d.faculty);
        if (d.department) setDepartment(d.department);
        if (d.businessName) setBusinessName(d.businessName);
        if (d.businessAddress) setBusinessAddress(d.businessAddress);
        if (d.sellerType) setSellerType(d.sellerType);
      }
    } catch {}
  }, []);

  // Save form draft so navigating away never loses progress
  React.useEffect(() => {
    try {
      sessionStorage.setItem(
        "ct_vendor_form_draft",
        JSON.stringify({
          fullName,
          email,
          phone,
          whatsapp,
          campusId,
          storeName,
          storeDescription,
          faculty,
          department,
          businessName,
          businessAddress,
          sellerType,
        })
      );
    } catch {}
  }, [
    fullName,
    email,
    phone,
    whatsapp,
    campusId,
    storeName,
    storeDescription,
    faculty,
    department,
    businessName,
    businessAddress,
    sellerType,
  ]);

  // Selected campus details
  const selectedCampus = campuses.find((c) => c.id === campusId);
  const guestVendorsEnabled = selectedCampus?.settings ? selectedCampus.settings.guestVendorsEnabled : true;
  const guestVendorCap = selectedCampus?.settings ? selectedCampus.settings.guestVendorCap : 50;
  const currentGuestCount = selectedCampus?._count?.vendors || 0;
  const isCapReached = currentGuestCount >= guestVendorCap;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setError("Please enter a valid phone number (at least 7 digits).");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please ensure both passwords are identical.");
      return;
    }

    if (sellerType === "student") {
      if (!email.trim() || !email.includes("@")) {
        setError("Please enter a valid student email address.");
        return;
      }
      if (!storeName.trim()) {
        setError("Please enter a store name.");
        return;
      }
      if (!studentIdUrl || !studentIdUrl.trim()) {
        setError("Student ID photo is mandatory. Please upload a clear photo of yourself holding your student ID card next to your face.");
        return;
      }
    }
    // Validate Guest specifics
    if (sellerType === "guest") {
      if (!guestVendorsEnabled) {
        setError(`Guest registration is temporarily disabled on ${selectedCampus?.name || "this campus"}. Only verified students can sell.`);
        return;
      }
      if (!businessName.trim() && !storeName.trim()) {
        setError("Please enter your Business / Trade name.");
        return;
      }
      if (!businessAddress.trim()) {
        setError("Please enter your physical shop or business address.");
        return;
      }
      if (!idDocumentPath || !selfieDocumentPath) {
        setError("Please upload your government-issued ID and selfie holding your ID for Tier 2 verification.");
        return;
      }
    }

    setLoading(true);

    try {
      const cleanPhone = cleanPhoneNumber(phone);
      const cleanWhatsapp = cleanPhoneNumber(whatsapp) || cleanPhone;
      const effectivePhone = cleanPhone || cleanWhatsapp || undefined;

      const payload: any = {
        fullName,
        email: email || undefined,
        password,
        phone: effectivePhone,
        whatsapp: cleanWhatsapp || effectivePhone,
        role: "VENDOR",
        sellerType,
        storeName: storeName || businessName,
        campusId,
        storeDescription,
        referralCode: referralCode ? referralCode.trim().toUpperCase() : undefined,
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

      try {
        sessionStorage.removeItem("ct_vendor_form_draft");
      } catch {}

      window.location.href = data.redirectTo || "/dashboard";
    } catch (err: any) {
      console.error("Vendor register error:", err);
      const msg = err.message || "";
      const isSystem = msg.includes("fetch") || msg.includes("Prisma") || msg.includes("500");
      setError(isSystem ? "Something went wrong. Please try again later." : msg || "Something went wrong. Please try again later.");
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
              <ShoppingCart className="w-5 h-5" />
            </div>
            <span className="font-black text-2xl tracking-tight text-neutral-900 lowercase">
              ọ<span className="text-emerald-600">jà</span>
            </span>
          </Link>
          <h1 className="text-2xl sm:text-4xl font-black text-neutral-950 tracking-tight">
            Start Selling on ọjà
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-lg mx-auto">
            Sell directly to thousands of Nigerian university students. Choose whether you&apos;re a student or an external business to get started.
          </p>
        </div>

        {/* Seller Type Selector Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-600">
              Who is selling?
            </span>
            <span className="text-[11px] text-neutral-400">
              Select your seller account
            </span>
          </div>
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
                  Student Seller
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-neutral-900">
                  I am a Campus Student
                </p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Undergraduates &amp; postgraduates selling textbooks, tech, thrift, or hostel services.
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
                  External Seller
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-extrabold text-neutral-900">
                  I am an Off-Campus Seller
                </p>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Alumni, local shops, store owners &amp; businesses serving campus students.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-emerald-200/60 text-[11px] text-emerald-800 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Safe meetup points &bull; Government ID review
              </div>
            </button>
          </div>
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
                  maxLength={70}
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
                  minLength={7}
                  maxLength={15}
                  placeholder="e.g. 0801 234 5678"
                  value={phone}
                  onChange={(e) => {
                    const formatted = formatNigerianPhone(e.target.value);
                    setPhone(formatted);
                    if (!whatsapp || whatsapp === "+234 ") setWhatsapp(formatted);
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
                  maxLength={100}
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
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={64}
                    placeholder="Minimum 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl text-xs h-10 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-neutral-700">Confirm Password *</label>
                  {confirmPassword.length > 0 && password === confirmPassword && (
                    <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Match
                    </span>
                  )}
                  {confirmPassword.length > 0 && password !== confirmPassword && (
                    <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Mismatch
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Input
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    minLength={6}
                    maxLength={64}
                    placeholder="Re-enter password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`rounded-xl text-xs h-10 pr-10 ${
                      confirmPassword.length > 0 && password !== confirmPassword
                        ? "border-rose-400"
                        : confirmPassword.length > 0 && password === confirmPassword
                        ? "border-emerald-400"
                        : ""
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {password && (
              <PasswordStrengthGauge password={password} />
            )}

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

            {/* Ambassador / Referral Code */}
            <div className="space-y-1 pt-1">
              <label className="text-xs font-bold text-neutral-700 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  Campus Ambassador / Referral Code (Optional)
                </span>
                {referralCode && (
                  <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Ambassador Code Applied
                  </span>
                )}
              </label>
              <Input
                maxLength={12}
                placeholder="e.g. UNILAG-AYO"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                className="rounded-xl text-xs font-mono uppercase h-10"
              />
              <p className="text-[11px] text-neutral-400">
                Did a student ambassador introduce you to ọjà? Enter their code so they receive credit for onboarding your store.
              </p>
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
                  maxLength={60}
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
                    maxLength={60}
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
                maxLength={400}
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
                  maxLength={200}
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
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200/90 space-y-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="p-1 rounded-lg bg-amber-200/80 text-amber-900 shrink-0">
                      <Camera className="w-4 h-4" />
                    </span>
                    <h3 className="text-xs font-black uppercase tracking-wider text-amber-950 flex flex-wrap items-center gap-2">
                      Mandatory Verification Requirement
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-200 text-amber-950 font-extrabold shrink-0">
                        Required
                      </span>
                    </h3>
                  </div>

                  <p className="text-xs text-amber-950 leading-relaxed font-semibold">
                    You must upload a clear photo of yourself <strong>holding your university student ID card next to your face</strong> (selfie holding student ID).
                  </p>

                  <ul className="text-[11px] text-amber-900/90 space-y-1 list-disc list-inside">
                    <li>Hold your physical student ID card right beside your face.</li>
                    <li>Both your face and all card details (full name, matriculation number, photo) must be distinctly visible and unblurred.</li>
                    <li>Do not cover your face, sunglasses, or digital crops.</li>
                  </ul>
                </div>

                <div className="space-y-1.5">
                  <SingleImageUpload
                    value={studentIdUrl}
                    onChange={setStudentIdUrl}
                    folder="stores"
                    label="Upload Photo: Holding Student ID Next to Face *"
                    hint="Selfie holding your university student ID card next to your face (PNG, JPG, or WEBP)"
                  />
                  {!studentIdUrl && (
                    <p className="text-[11px] font-semibold text-rose-500">
                      * This photo is mandatory to verify that you are a genuine campus student seller.
                    </p>
                  )}
                </div>
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
                <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-3 overflow-hidden">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-bold text-neutral-900 leading-snug">
                        Registered Business Verification (Optional)
                      </span>
                    </div>
                    <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300 w-fit shrink-0 self-start sm:self-auto max-w-full">
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
              <button
                type="button"
                onClick={() => setShowCodeOfConductModal(true)}
                className="text-emerald-600 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                <span>Seller Code of Conduct</span>
                <Info className="w-3.5 h-3.5 inline ml-0.5 text-emerald-500" />
              </button>{" "}
              and Escrow terms.
            </p>

            <Button
              type="submit"
              disabled={
                loading ||
                !fullName.trim() ||
                phone.trim().length < 7 ||
                password.length < 6 ||
                (confirmPassword.length > 0 && password !== confirmPassword) ||
                !campusId ||
                (sellerType === "student" && (!email.trim() || !email.includes("@") || !storeName.trim())) ||
                (sellerType === "guest" && (!guestVendorsEnabled || !businessName.trim() || !businessAddress.trim() || !idDocumentPath || !selfieDocumentPath))
              }
              className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold px-8 h-11 shadow-md shadow-emerald-600/20 transition-all inline-flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Verifying &amp; Creating Store...</span>
                </>
              ) : (
                `Complete ${sellerType === "guest" ? "Guest" : "Student"} Registration`
              )}
            </Button>
          </div>
        </form>

        {/* Full-screen Submission Load State Overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-neutral-100 p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100/80 shadow-inner">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-lg text-neutral-900">
                  Creating Your Store...
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Please hold on while we secure your vendor credentials and set up your campus storefront.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-left space-y-2 text-xs text-neutral-600">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Validating credentials &amp; campus</span>
                </div>
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Configuring vendor profile</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-800 font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 ml-0.5" />
                  <span>Redirecting to your dashboard...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Inline Seller Code of Conduct Modal (Leaves form intact!) */}
        {showCodeOfConductModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-neutral-100 p-6 sm:p-8 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-base text-neutral-900 leading-tight">
                      Seller Code of Conduct
                    </h3>
                    <p className="text-[11px] text-neutral-500">
                      Campus guidelines &amp; standards for sellers
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCodeOfConductModal(false)}
                  className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Rules list */}
              <div className="space-y-3.5 text-xs text-neutral-600 leading-relaxed">
                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-neutral-900 text-xs">Accurate Product Conditions</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Always declare whether an item is Brand New, Like New, or Fair. Upload real photographs of actual items you have on campus.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-neutral-900 text-xs">Responsive WhatsApp Communications</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Respond promptly to buyer inquiries and agree on clear pickup times at designated public campus landmarks during daylight hours.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-100 flex items-start gap-3">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-neutral-900 text-xs">Zero Tolerance for Counterfeits or Scams</p>
                    <p className="text-[11px] text-neutral-500 mt-0.5">
                      Deceptive listings or contraband result in instant store revocation, forfeiture of pending escrow payouts, and reporting to university authorities.
                    </p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-3 border-t border-neutral-100 flex items-center justify-between gap-3">
                <Link
                  href="/vendor-guidelines"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-semibold text-neutral-500 hover:text-neutral-900 flex items-center gap-1"
                >
                  <span>Open full page</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
                <Button
                  type="button"
                  onClick={() => setShowCodeOfConductModal(false)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold px-6 h-10 shadow-sm cursor-pointer"
                >
                  Got It &bull; Resume Form
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
