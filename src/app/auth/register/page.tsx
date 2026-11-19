"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Phone,
  Mail,
  User,
  MapPin,
  Building,
  GraduationCap,
  Store,
  UserCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader } from "@/components/ui/Loader";
import { useCampuses } from "@/hooks/use-campuses-query";
import { formatNigerianPhone, cleanPhoneNumber } from "@/lib/utils";
import { PasswordStrengthGauge } from "@/components/ui/PasswordStrengthGauge";

export const dynamic = "force-dynamic";

type RoleType = "BUYER" | "VENDOR";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Role selection: "BUYER" | "VENDOR" | null (null = initial account type selection screen)
  const [role, setRole] = React.useState<RoleType | null>(null);
  const [buyerType, setBuyerType] = React.useState<"student" | "guest">("student");

  // Stepper state:
  // Step 0: Account Type Selection
  // Step 1: Personal Information (Buyer & Vendor)
  // Step 2: Account Security (Final for Buyer; Step 2 of 3 for Vendor)
  // Step 3: Store Information (Final for Vendor)
  const [currentStep, setCurrentStep] = React.useState<number>(0);
  const [slideDirection, setSlideDirection] = React.useState<"forward" | "backward">("forward");

  // Step 1 Fields: Personal Information
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [phone, setPhone] = React.useState("+234 ");

  // Step 2 Fields: Security
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);

  // Step 3 Fields: Store Information (Vendor only)
  const [storeName, setStoreName] = React.useState("");
  const [campusId, setCampusId] = React.useState("clunilag001");
  const [whatsapp, setWhatsapp] = React.useState("+234 ");
  const [faculty, setFaculty] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [storeDescription, setStoreDescription] = React.useState("");

  // Campuses for vendor selection
  const { data: campusData } = useCampuses();
  const campuses = campusData?.campuses || [];

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  // Default campus selection
  React.useEffect(() => {
    if (campuses.length > 0 && (!campusId || campusId === "clunilag001")) {
      setCampusId(campuses[0].id);
    }
  }, [campuses, campusId]);

  // Keep WhatsApp in sync with phone unless user specifically customized it
  const [whatsappUserEdited, setWhatsappUserEdited] = React.useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNigerianPhone(e.target.value);
    setPhone(formatted);
    if (!whatsappUserEdited) {
      setWhatsapp(formatted);
    }
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWhatsappUserEdited(true);
    const formatted = formatNigerianPhone(e.target.value);
    setWhatsapp(formatted);
  };

  // Navigation helpers
  const goToStep = (step: number, direction: "forward" | "backward") => {
    setSlideDirection(direction);
    setError("");
    setCurrentStep(step);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleSelectRole = (selectedRole: RoleType, selectedBuyerType?: "student" | "guest") => {
    setRole(selectedRole);
    if (selectedBuyerType) {
      setBuyerType(selectedBuyerType);
    }
    goToStep(1, "forward");
  };

  // Field validations
  const isNameValid = fullName.trim().length >= 2;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const isPhoneValid = cleanPhoneNumber(phone).replace(/\D/g, "").length >= 10;
  const isStep1Valid = isNameValid && isEmailValid && isPhoneValid;

  const isPasswordValid = password.length >= 6;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const isStep2Valid = isPasswordValid && passwordsMatch;

  const isStoreNameValid = storeName.trim().length >= 2;
  const isCampusValid = Boolean(campusId && campusId.trim().length > 0);
  const isWhatsappValid = cleanPhoneNumber(whatsapp).replace(/\D/g, "").length >= 10;
  const isStep3Valid = isStoreNameValid && isCampusValid && isWhatsappValid;

  const totalSteps = role === "VENDOR" ? 3 : 2;

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!role) {
      setError("Please select an account type first.");
      goToStep(0, "backward");
      return;
    }

    if (!isStep1Valid) {
      setError("Please complete all required personal information fields.");
      goToStep(1, "backward");
      return;
    }

    if (!isStep2Valid) {
      setError("Please ensure your password is at least 6 characters and both passwords match.");
      goToStep(2, "backward");
      return;
    }

    if (role === "VENDOR" && !isStep3Valid) {
      setError("Please fill out the required store name and valid WhatsApp number.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cleanPhone = cleanPhoneNumber(phone);
      const cleanWhatsapp = whatsapp ? cleanPhoneNumber(whatsapp) : cleanPhone;

      const payload: any = {
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        phone: cleanPhone,
        role,
        buyerType: role === "BUYER" ? buyerType : undefined,
      };

      if (role === "VENDOR") {
        payload.storeName = storeName.trim();
        payload.campusId = campusId;
        payload.whatsapp = cleanWhatsapp || cleanPhone;
        payload.faculty = faculty.trim();
        payload.department = department.trim();
        payload.storeDescription = storeDescription.trim();
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Registration failed");
      }

      const targetUrl = data.redirectTo || (role === "VENDOR" ? "/dashboard" : "/shop");
      window.location.href = targetUrl;
    } catch (err: any) {
      console.error("Registration error:", err);
      const msg = err.message || "";
      const isSystemError =
        msg.includes("fetch") ||
        msg.includes("Failed to fetch") ||
        msg.includes("Prisma") ||
        msg.includes("database") ||
        msg.includes("SQL") ||
        msg.includes("500") ||
        msg.includes("Internal");
      setError(
        isSystemError ? "Something went wrong. Please try again later." : msg || "Something went wrong. Please try again later."
      );
      setLoading(false);
    }
  };

  // Keyboard navigation on Enter
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.target as HTMLElement).tagName !== "TEXTAREA") {
      e.preventDefault();
      if (currentStep === 1 && isStep1Valid) {
        goToStep(2, "forward");
      } else if (currentStep === 2) {
        if (role === "VENDOR" && isStep2Valid) {
          goToStep(3, "forward");
        } else if (role === "BUYER" && isStep2Valid && !loading) {
          handleSubmit(e as any);
        }
      } else if (currentStep === 3 && role === "VENDOR" && isStep3Valid && !loading) {
        handleSubmit(e as any);
      }
    }
  };

  const animationClass =
    slideDirection === "forward"
      ? "animate-in fade-in-50 slide-in-from-right-8 duration-300"
      : "animate-in fade-in-50 slide-in-from-left-8 duration-300";

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-10 sm:py-14 px-4 bg-gradient-to-b from-neutral-50 via-neutral-100/50 to-neutral-50">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-neutral-200/80 shadow-2xl shadow-neutral-900/5 p-6 sm:p-9 space-y-7 transition-all">
        {/* =================================================================== */}
        {/* SCREEN 0: Initial Screen – Account Type Selection                   */}
        {/* =================================================================== */}
        {currentStep === 0 && (
          <div className="space-y-7 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100 shadow-sm">
                <GraduationCap className="w-6 h-6" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 tracking-tight">
                Join CampusTrade
              </h1>
              <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto leading-relaxed">
                Connect directly with verified students and trusted campus merchants. How would you like to use CampusTrade?
              </p>
            </div>

            {/* Error Notification if any */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in-50">
                {error}
              </div>
            )}

            {/* Account Type Selection Cards */}
            <div className="space-y-3">
              {/* Option 1: Student Buyer */}
              <button
                type="button"
                onClick={() => handleSelectRole("BUYER", "student")}
                className="w-full group p-4 sm:p-4.5 rounded-2xl border-2 border-neutral-200/90 hover:border-emerald-500 bg-neutral-50/50 hover:bg-emerald-50/20 text-left transition-all duration-200 hover:shadow-md hover:shadow-emerald-600/5 relative flex items-center gap-3.5 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-white border border-neutral-200/80 group-hover:border-emerald-300 text-emerald-600 flex items-center justify-center shrink-0 shadow-xs transition-colors">
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-black text-neutral-900 group-hover:text-emerald-950 transition-colors">
                      Student Buyer
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full">
                      Student
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                    Shop campus listings, textbooks, and hostel delivery.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* Option 2: Guest Buyer */}
              <button
                type="button"
                onClick={() => handleSelectRole("BUYER", "guest")}
                className="w-full group p-4 sm:p-4.5 rounded-2xl border-2 border-neutral-200/90 hover:border-sky-500 bg-neutral-50/50 hover:bg-sky-50/20 text-left transition-all duration-200 hover:shadow-md hover:shadow-sky-600/5 relative flex items-center gap-3.5 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-white border border-neutral-200/80 group-hover:border-sky-300 text-sky-600 flex items-center justify-center shrink-0 shadow-xs transition-colors">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-black text-neutral-900 group-hover:text-sky-950 transition-colors">
                      Guest Buyer
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-sky-700 bg-sky-100/70 px-2 py-0.5 rounded-full">
                      Guest
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                    Browse and buy without student email verification.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-sky-600 group-hover:translate-x-1 transition-all shrink-0" />
              </button>

              {/* Option 3: Campus Vendor */}
              <button
                type="button"
                onClick={() => handleSelectRole("VENDOR")}
                className="w-full group p-4 sm:p-4.5 rounded-2xl border-2 border-neutral-200/90 hover:border-purple-500 bg-neutral-50/50 hover:bg-purple-50/20 text-left transition-all duration-200 hover:shadow-md hover:shadow-purple-600/5 relative flex items-center gap-3.5 cursor-pointer"
              >
                <div className="w-11 h-11 rounded-xl bg-white border border-neutral-200/80 group-hover:border-purple-300 text-purple-600 flex items-center justify-center shrink-0 shadow-xs transition-colors">
                  <Store className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm sm:text-base font-black text-neutral-900 group-hover:text-purple-950 transition-colors">
                      Campus Vendor
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100/70 px-2 py-0.5 rounded-full">
                      Seller
                    </span>
                  </div>
                  <p className="text-xs text-neutral-500 mt-0.5 line-clamp-1">
                    Open a verified campus store and sell to students.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-purple-600 group-hover:translate-x-1 transition-all shrink-0" />
              </button>
            </div>

            {/* Quick Guest Browsing Link */}
            <div className="text-center pt-0.5">
              <Link
                href="/shop"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-emerald-700 transition-colors"
              >
                <span>Just looking around? Explore marketplace as guest</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* Footer / Login Link */}
            <div className="pt-2 text-center text-xs text-neutral-500 border-t border-neutral-100">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Sign In here
              </Link>
            </div>
          </div>
        )}

        {/* =================================================================== */}
        {/* REGISTRATION FLOW (Steps 1, 2, and 3)                                */}
        {/* =================================================================== */}
        {currentStep > 0 && (
          <form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="space-y-6">
            {/* Top Stepper Header */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => goToStep(currentStep - 1, "backward")}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-500 hover:text-neutral-900 transition-colors cursor-pointer group"
                >
                  <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                  <span>
                    {currentStep === 1
                      ? "Change account type"
                      : "Previous step"}
                  </span>
                </button>

                <div className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border border-neutral-200/80 bg-neutral-50">
                  {role === "VENDOR" ? (
                    <span className="flex items-center gap-1.5 text-purple-700">
                      <Store className="w-3.5 h-3.5 text-purple-600" />
                      <span>Vendor Flow</span>
                    </span>
                  ) : buyerType === "guest" ? (
                    <span className="flex items-center gap-1.5 text-sky-700">
                      <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                      <span>Guest Buyer</span>
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-emerald-700">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Student Buyer</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Step Title & Subtitle */}
              <div>
                <h2 className="text-xl sm:text-2xl font-black text-neutral-900 tracking-tight">
                  {currentStep === 1 && "Personal Information"}
                  {currentStep === 2 && "Account Security"}
                  {currentStep === 3 && "Store Information"}
                </h2>
                <p className="text-xs sm:text-sm text-neutral-500 mt-0.5">
                  {currentStep === 1 &&
                    "Enter your basic details to set up your profile and contact channel."}
                  {currentStep === 2 &&
                    "Create a strong password to keep your campus account safe and secure."}
                  {currentStep === 3 &&
                    "Set up your store name, university campus, and WhatsApp ordering line."}
                </p>
              </div>
            </div>

            {/* Error Notification if any */}
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold animate-in fade-in-50">
                {error}
              </div>
            )}

            {/* =============================================================== */}
            {/* STEP 1: Personal Information (Both Buyer & Vendor)              */}
            {/* =============================================================== */}
            {currentStep === 1 && (
              <div key="step-1" className={`space-y-4 ${animationClass}`}>
                {/* Full Name */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-neutral-700 block">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type="text"
                      required
                      autoFocus
                      placeholder="e.g. Tobi Adebayo"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="pl-10 h-12 rounded-xl text-sm bg-neutral-50/60 border-neutral-200 focus:bg-white text-neutral-900"
                    />
                  </div>
                  {fullName.length > 0 && !isNameValid && (
                    <p className="text-[11px] text-rose-500 font-medium">
                      Full name must be at least 2 characters.
                    </p>
                  )}
                </div>

                {/* Email Address */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-neutral-700 block">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type="email"
                      required
                      placeholder={
                        buyerType === "guest"
                          ? "personal@email.com"
                          : "student@unilag.edu.ng or personal@email.com"
                      }
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10 h-12 rounded-xl text-sm bg-neutral-50/60 border-neutral-200 focus:bg-white text-neutral-900"
                    />
                  </div>
                  {email.length > 0 && !isEmailValid && (
                    <p className="text-[11px] text-rose-500 font-medium">
                      Please enter a valid email address.
                    </p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-neutral-700 block">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      Format: +234 814 817 6165
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type="tel"
                      required
                      placeholder="+234 814 817 6165"
                      value={phone}
                      onChange={handlePhoneChange}
                      className="pl-10 h-12 rounded-xl text-sm bg-neutral-50/60 border-neutral-200 focus:bg-white text-neutral-900"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Type or paste 10 or 11 digits. &apos;+234&apos; is automatically formatted.
                  </p>
                </div>

                {/* Step 1 Navigation Buttons */}
                <div className="pt-3 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goToStep(0, "backward")}
                    className="h-11 px-5 rounded-xl text-xs font-bold border-neutral-200 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    <span>Back</span>
                  </Button>

                  <Button
                    type="button"
                    disabled={!isStep1Valid}
                    onClick={() => goToStep(2, "forward")}
                    className="h-11 px-6 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 ml-auto"
                  >
                    <span>Next: Security</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* STEP 2: Account Security (Both Buyer & Vendor)                  */}
            {/* =============================================================== */}
            {currentStep === 2 && (
              <div key="step-2" className={`space-y-4 ${animationClass}`}>
                {/* Password Input */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-neutral-700 block">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      required
                      autoFocus
                      placeholder="Minimum 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10 pr-10 h-12 rounded-xl text-sm bg-neutral-50/60 border-neutral-200 focus:bg-white text-neutral-900"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Strength Gauge */}
                {password && (
                  <PasswordStrengthGauge password={password} />
                )}

                {/* Confirm Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-neutral-700 block">
                      Confirm Password <span className="text-rose-500">*</span>
                    </label>
                    {passwordsMatch && (
                      <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Passwords match
                      </span>
                    )}
                    {passwordsMismatch && (
                      <span className="text-[11px] font-bold text-rose-500 flex items-center gap-1 animate-in fade-in">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Passwords do not match
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`pl-10 pr-10 h-12 rounded-xl text-sm bg-neutral-50/60 text-neutral-900 ${
                        passwordsMismatch
                          ? "border-rose-400 focus-visible:ring-rose-500/20"
                          : passwordsMatch
                          ? "border-emerald-400 focus-visible:ring-emerald-500/20"
                          : "border-neutral-200 focus:bg-white"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Step 2 Navigation Buttons */}
                <div className="pt-3 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goToStep(1, "backward")}
                    className="h-11 px-5 rounded-xl text-xs font-bold border-neutral-200 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    <span>Back</span>
                  </Button>

                  {role === "BUYER" ? (
                    /* Final Button for Buyer */
                    <Button
                      type="submit"
                      disabled={!isStep2Valid || loading}
                      className={`h-11 px-7 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ml-auto ${
                        loading
                          ? "bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed pointer-events-none shadow-none opacity-80"
                          : !isStep2Valid
                          ? "bg-neutral-200 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-60"
                          : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 cursor-pointer"
                      }`}
                    >
                      {loading ? (
                        <div className="flex items-center gap-2 text-neutral-500">
                          <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                          <span>Creating your account...</span>
                        </div>
                      ) : (
                        <>
                          <span>
                            {buyerType === "guest"
                              ? "Create Guest Account"
                              : "Create Student Account"}
                          </span>
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </Button>
                  ) : (
                    /* Next Button for Vendor (proceeds to Step 3) */
                    <Button
                      type="button"
                      disabled={!isStep2Valid}
                      onClick={() => goToStep(3, "forward")}
                      className="h-11 px-6 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5 ml-auto"
                    >
                      <span>Next: Store Info</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* STEP 3: Store Information (Vendor Only - Final Step)            */}
            {/* =============================================================== */}
            {currentStep === 3 && role === "VENDOR" && (
              <div key="step-3" className={`space-y-4 ${animationClass}`}>
                {/* Information Banner */}
                <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900 flex items-center gap-2.5">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>
                    Your storefront will be visible to students on your campus. Buyers can browse your products and place direct WhatsApp orders.
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Store Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-neutral-700 block">
                      Store Name <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <ShoppingBag className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <Input
                        type="text"
                        required
                        autoFocus
                        placeholder="e.g. Unilag Drip Corner"
                        value={storeName}
                        onChange={(e) => setStoreName(e.target.value)}
                        className="pl-10 h-12 rounded-xl text-sm bg-neutral-50/60 border-neutral-200 focus:bg-white text-neutral-900"
                      />
                    </div>
                  </div>

                  {/* Campus Location */}
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-neutral-700 block">
                      Campus Location <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                      <select
                        aria-label="Select Campus Location"
                        className="flex h-12 w-full rounded-xl border border-neutral-200 bg-neutral-50/60 pl-10 pr-4 text-sm text-neutral-900 focus-visible:outline-none focus:bg-white focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                        value={campusId}
                        onChange={(e) => setCampusId(e.target.value)}
                      >
                        {campuses.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                        {campuses.length === 0 && (
                          <>
                            <option value="unilag">University of Lagos (UNILAG)</option>
                            <option value="ui">University of Ibadan (UI)</option>
                            <option value="oau">Obafemi Awolowo University (OAU)</option>
                          </>
                        )}
                      </select>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Number for Orders */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs sm:text-sm font-bold text-neutral-700 block">
                      WhatsApp for Orders <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-neutral-400 font-medium">
                      Format: +234 814 817 6165
                    </span>
                  </div>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <Input
                      type="tel"
                      required
                      placeholder="+234 814 817 6165"
                      value={whatsapp}
                      onChange={handleWhatsappChange}
                      className="pl-10 h-12 rounded-xl text-sm bg-neutral-50/60 border-neutral-200 focus:bg-white text-neutral-900"
                    />
                  </div>
                  <p className="text-[11px] text-neutral-400">
                    Buyers will tap a WhatsApp button on your listings to coordinate campus deliveries.
                  </p>
                </div>

                {/* Faculty & Department */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-neutral-700 block">
                      Faculty (Optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Engineering"
                      value={faculty}
                      onChange={(e) => setFaculty(e.target.value)}
                      className="h-12 rounded-xl text-sm bg-neutral-50/60 border-neutral-200 focus:bg-white text-neutral-900"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs sm:text-sm font-bold text-neutral-700 block">
                      Department (Optional)
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g. Electrical Engineering"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      className="h-12 rounded-xl text-sm bg-neutral-50/60 border-neutral-200 focus:bg-white text-neutral-900"
                    />
                  </div>
                </div>

                {/* Store Bio */}
                <div className="space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-neutral-700 block">
                    Store Short Bio (Optional)
                  </label>
                  <textarea
                    className="w-full rounded-xl border border-neutral-200 bg-neutral-50/60 p-3.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 resize-none h-20"
                    placeholder="Describe what you sell, hostel pickup locations, and active sales hours..."
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                  />
                </div>

                {/* Step 3 Navigation Buttons */}
                <div className="pt-3 flex items-center justify-between gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goToStep(2, "backward")}
                    className="h-11 px-5 rounded-xl text-xs font-bold border-neutral-200 text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1.5" />
                    <span>Back</span>
                  </Button>

                  <Button
                    type="submit"
                    disabled={!isStep3Valid || loading}
                    className={`h-11 px-7 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ml-auto ${
                      loading
                        ? "bg-neutral-200 text-neutral-400 border border-neutral-300 cursor-not-allowed pointer-events-none shadow-none opacity-80"
                        : !isStep3Valid
                        ? "bg-neutral-200 text-neutral-400 border border-neutral-200 cursor-not-allowed opacity-60"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-600/20 cursor-pointer"
                    }`}
                  >
                    {loading ? (
                      <div className="flex items-center gap-2 text-neutral-500">
                        <Loader2 className="w-4 h-4 animate-spin text-neutral-500" />
                        <span>Creating your store...</span>
                      </div>
                    ) : (
                      <>
                        <span>Register Student Store</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {/* =============================================================== */}
            {/* PROGRESS INDICATOR (DOTS) – Only shown when currentStep > 0     */}
            {/* =============================================================== */}
            <div className="pt-4 border-t border-neutral-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                Step {currentStep} of {totalSteps}:{" "}
                <span className="text-neutral-800 normal-case font-semibold">
                  {currentStep === 1 && "Personal Information"}
                  {currentStep === 2 && "Account Security"}
                  {currentStep === 3 && "Store Information"}
                </span>
              </span>

              {/* Stepper Dots */}
              <div className="flex items-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, index) => {
                  const stepNumber = index + 1;
                  const isCurrent = currentStep === stepNumber;
                  const isCompleted = currentStep > stepNumber;

                  return (
                    <div
                      key={stepNumber}
                      title={`Step ${stepNumber}`}
                      className={`transition-all duration-300 rounded-full ${
                        isCurrent
                          ? "w-7 h-2.5 bg-emerald-600 shadow-xs"
                          : isCompleted
                          ? "w-2.5 h-2.5 bg-emerald-500"
                          : "w-2.5 h-2.5 bg-neutral-200"
                      }`}
                    />
                  );
                })}
              </div>
            </div>

            {/* Bottom link to login */}
            <div className="text-center text-xs text-neutral-500">
              Already have an account?{" "}
              <Link
                href="/auth/login"
                className="font-bold text-emerald-600 hover:text-emerald-700 hover:underline"
              >
                Sign In here
              </Link>
            </div>
          </form>
        )}

        {/* Full-screen Submission Load State Overlay */}
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-neutral-100 p-8 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100/80 shadow-inner">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
              
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-lg text-neutral-900">
                  {role === "VENDOR" ? "Setting Up Your Store..." : "Creating Your Account..."}
                </h3>
                <p className="text-xs text-neutral-500 leading-relaxed">
                  Please hold on while we save your credentials and initialize your profile.
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-neutral-50 border border-neutral-200/60 text-left space-y-2 text-xs text-neutral-600">
                <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Connecting to campus database</span>
                </div>
                <div className="flex items-center gap-2 text-neutral-800 font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                  <span>Finalizing setup &amp; redirecting...</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <React.Suspense fallback={<Loader isModal={true} />}>
      <RegisterContent />
    </React.Suspense>
  );
}
