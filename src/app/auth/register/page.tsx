"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Store,
  ShoppingBag,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Info,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  Phone,
  Mail,
  User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCampuses } from "@/hooks/use-campuses-query";
import { formatNigerianPhone, cleanPhoneNumber } from "@/lib/utils";
import { PasswordStrengthGauge } from "@/components/ui/PasswordStrengthGauge";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = React.useState<"BUYER" | "VENDOR" | null>(null);
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = React.useState(false);
  const [phone, setPhone] = React.useState("+234 ");

  // Vendor fields
  const [storeName, setStoreName] = React.useState("");
  const [campusId, setCampusId] = React.useState("clunilag001");
  const [whatsapp, setWhatsapp] = React.useState("+234 ");
  const [faculty, setFaculty] = React.useState("");
  const [department, setDepartment] = React.useState("");
  const [storeDescription, setStoreDescription] = React.useState("");

  const { data: campusData } = useCampuses();
  const campuses = campusData?.campuses || [];
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    if (campuses.length > 0 && (!campusId || campusId === "clunilag001")) {
      setCampusId(campuses[0].id);
    }
  }, [campuses, campusId]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNigerianPhone(e.target.value);
    setPhone(formatted);
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatNigerianPhone(e.target.value);
    setWhatsapp(formatted);
  };

  const isFormDisabled = !role || loading;
  const passwordsMatch =
    confirmPassword.length > 0 && password === confirmPassword;
  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!role) {
      setError("Please select whether you are creating a Student Buyer or Vendor account.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match. Please ensure both passwords are identical.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const cleanPhone = cleanPhoneNumber(phone);
      const cleanWhatsapp = whatsapp ? cleanPhoneNumber(whatsapp) : cleanPhone;

      const payload: any = {
        fullName,
        email,
        password,
        phone: cleanPhone,
        role,
      };

      if (role === "VENDOR") {
        payload.storeName = storeName;
        payload.campusId = campusId;
        payload.whatsapp = cleanWhatsapp || cleanPhone;
        payload.faculty = faculty;
        payload.department = department;
        payload.storeDescription = storeDescription;
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

      router.push(data.redirectTo || (role === "VENDOR" ? "/dashboard" : "/shop"));
      router.refresh();
    } catch (err: any) {
      setError(
        err.message || "Failed to register. Please check your information.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-neutral-50/70">
      <div className="w-full max-w-xl bg-white rounded-3xl border border-neutral-100 shadow-xl p-7 sm:p-9 space-y-6">
        {/* Header */}
        <div className="text-center space-y-1.5">
          <h1 className="text-2xl font-black text-neutral-900 tracking-tight">
            Join Campus<span className="text-emerald-500">Trade</span>
          </h1>
          <p className="text-xs text-neutral-500">
            Create an account to start buying on campus or launch your student store
          </p>
        </div>

        {/* Role Selection / Account Type Tabs */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
              Select Account Type <span className="text-rose-500">*</span>
            </label>
            {!role && (
              <span className="text-[11px] text-amber-600 font-semibold animate-pulse">
                Select one to unlock fields
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Student Buyer Option */}
            <button
              type="button"
              onClick={() => {
                setRole("BUYER");
                setError("");
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative group flex items-start gap-3 cursor-pointer ${
                role === "BUYER"
                  ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                  : "bg-neutral-50/80 hover:bg-white border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  role === "BUYER"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-neutral-700 border border-neutral-200 group-hover:text-emerald-600"
                }`}
              >
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">
                    Student Buyer
                  </span>
                  {role === "BUYER" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2 leading-snug">
                  Browse listings, save items &amp; place campus orders
                </p>
              </div>
            </button>

            {/* Student Seller / Vendor Option */}
            <button
              type="button"
              onClick={() => {
                setRole("VENDOR");
                setError("");
              }}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative group flex items-start gap-3 cursor-pointer ${
                role === "VENDOR"
                  ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
                  : "bg-neutral-50/80 hover:bg-white border-neutral-200 hover:border-neutral-300"
              }`}
            >
              <div
                className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  role === "VENDOR"
                    ? "bg-emerald-600 text-white shadow-xs"
                    : "bg-white text-neutral-700 border border-neutral-200 group-hover:text-emerald-600"
                }`}
              >
                <Store className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-neutral-900">
                    Student Seller / Vendor
                  </span>
                  {role === "VENDOR" && (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2 leading-snug">
                  Open your verified store, list products &amp; reach students
                </p>
              </div>
            </button>
          </div>

          {!role && (
            <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-200 text-amber-800 text-xs flex items-center gap-2 animate-in fade-in-50">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Please select <strong>Student Buyer</strong> or <strong>Student Seller / Vendor</strong> above to enable registration.</span>
            </div>
          )}
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium animate-in fade-in-50">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label
                className={`text-xs font-bold block transition-colors ${
                  !role ? "text-neutral-400" : "text-neutral-700"
                }`}
              >
                Full Name
              </label>
              <Input
                type="text"
                required
                disabled={isFormDisabled}
                placeholder="e.g. Tobi Adebayo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={
                  !role
                    ? "bg-neutral-100/90 text-neutral-400 border-neutral-200 cursor-not-allowed select-none placeholder:text-neutral-400/70"
                    : ""
                }
              />
            </div>
            <div className="space-y-1.5">
              <label
                className={`text-xs font-bold block transition-colors ${
                  !role ? "text-neutral-400" : "text-neutral-700"
                }`}
              >
                Email Address
              </label>
              <Input
                type="email"
                required
                disabled={isFormDisabled}
                placeholder="student@unilag.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={
                  !role
                    ? "bg-neutral-100/90 text-neutral-400 border-neutral-200 cursor-not-allowed select-none placeholder:text-neutral-400/70"
                    : ""
                }
              />
            </div>
          </div>

          {/* Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Password */}
            <div className="space-y-1.5">
              <label
                className={`text-xs font-bold block transition-colors ${
                  !role ? "text-neutral-400" : "text-neutral-700"
                }`}
              >
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  disabled={isFormDisabled}
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`pr-10 ${
                    !role
                      ? "bg-neutral-100/90 text-neutral-400 border-neutral-200 cursor-not-allowed select-none placeholder:text-neutral-400/70"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  disabled={isFormDisabled}
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                    !role
                      ? "text-neutral-300 cursor-not-allowed"
                      : "text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  }`}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  className={`text-xs font-bold block transition-colors ${
                    !role ? "text-neutral-400" : "text-neutral-700"
                  }`}
                >
                  Confirm Password
                </label>
                {passwordsMatch && (
                  <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Match
                  </span>
                )}
                {passwordsMismatch && (
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
                  disabled={isFormDisabled}
                  placeholder="Re-enter password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pr-10 ${
                    !role
                      ? "bg-neutral-100/90 text-neutral-400 border-neutral-200 cursor-not-allowed select-none placeholder:text-neutral-400/70"
                      : passwordsMismatch
                      ? "border-rose-400 focus-visible:ring-rose-500/20"
                      : passwordsMatch
                      ? "border-emerald-400 focus-visible:ring-emerald-500/20"
                      : ""
                  }`}
                />
                <button
                  type="button"
                  disabled={isFormDisabled}
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3 top-1/2 -translate-y-1/2 transition-colors ${
                    !role
                      ? "text-neutral-300 cursor-not-allowed"
                      : "text-neutral-400 hover:text-neutral-600 cursor-pointer"
                  }`}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Password Strength Gauge */}
          {password && !isFormDisabled && (
            <PasswordStrengthGauge password={password} />
          )}

          {/* Phone Number Field */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label
                className={`text-xs font-bold block transition-colors ${
                  !role ? "text-neutral-400" : "text-neutral-700"
                }`}
              >
                Phone Number
              </label>
            </div>
            <div className="relative">
              <Phone
                className={`w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors ${
                  !role ? "text-neutral-300" : "text-neutral-400"
                }`}
              />
              <Input
                type="tel"
                required
                disabled={isFormDisabled}
                placeholder="+234 814 817 6165"
                value={phone}
                onChange={handlePhoneChange}
                className={`pl-10 h-11 ${
                  !role
                    ? "bg-neutral-100/90 text-neutral-400 border-neutral-200 cursor-not-allowed select-none placeholder:text-neutral-400/70"
                    : ""
                }`}
              />
            </div>
          </div>

          {/* Vendor Specific Onboarding Fields */}
          {role === "VENDOR" && (
            <div className="pt-4 border-t border-neutral-100 space-y-4 animate-in fade-in-50">
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-900 flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>
                  Student vendors receive a customizable storefront, layout picker, and direct customer WhatsApp ordering.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Store Name
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Unilag Drip Corner"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Campus Location
                  </label>
                  <select
                    aria-label="Select Campus Location"
                    className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3.5 py-2 text-sm text-neutral-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20"
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
                        <option value="unilag">
                          University of Lagos (UNILAG)
                        </option>
                        <option value="ui">University of Ibadan (UI)</option>
                        <option value="oau">
                          Obafemi Awolowo University (OAU)
                        </option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    WhatsApp for Orders
                  </label>
                  <Input
                    type="tel"
                    required
                    placeholder="+234 814 817 6165"
                    value={whatsapp}
                    onChange={handleWhatsappChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Faculty / Department
                  </label>
                  <Input
                    type="text"
                    placeholder="e.g. Engineering / Electrical"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">
                  Store Short Bio
                </label>
                <textarea
                  className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20 resize-none h-20"
                  placeholder="Describe what you sell and your campus delivery schedule..."
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={isFormDisabled || (confirmPassword.length > 0 && password !== confirmPassword)}
            className={`w-full h-11 flex items-center justify-center gap-2 font-bold rounded-2xl transition-all shadow-md ${
              !role
                ? "bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20 cursor-pointer"
            }`}
          >
            {loading ? (
              "Creating your account..."
            ) : !role ? (
              "Select Account Type to Register"
            ) : role === "VENDOR" ? (
              <>
                <span>Register Student Store</span>
                <ArrowRight size={18} />
              </>
            ) : (
              <>
                <span>Create Buyer Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </Button>
        </form>

        {/* Login Prompt */}
        <div className="pt-2 text-center text-xs text-neutral-500">
          Already have an account?{" "}
          <Link
            href="/auth/login"
            className="font-bold text-emerald-600 hover:underline"
          >
            Sign In here
          </Link>
        </div>
      </div>
    </div>
  );
}
