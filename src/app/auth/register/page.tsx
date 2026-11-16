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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCampuses } from "@/hooks/use-campuses-query";

export default function RegisterPage() {
  const router = useRouter();
  const [role, setRole] = React.useState<"BUYER" | "VENDOR">("BUYER");
  const [fullName, setFullName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [phone, setPhone] = React.useState("");

  // Vendor fields
  const [storeName, setStoreName] = React.useState("");
  const [campusId, setCampusId] = React.useState("clunilag001");
  const [whatsapp, setWhatsapp] = React.useState("");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload: any = {
        fullName,
        email,
        password,
        phone,
        role,
      };

      if (role === "VENDOR") {
        payload.storeName = storeName;
        payload.campusId = campusId;
        payload.whatsapp = whatsapp || phone;
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

      router.push(data.redirectTo || "/shop");
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
      <div className="w-full max-w-lg bg-white rounded-3xl border border-neutral-100 shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-extrabold text-neutral-900">
            Join CampusTrade
          </h1>
        </div>

        {/* Role Selection / Account Type Tabs */}
        <div className="space-y-2">
          <label className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider block">
            Select Account Type
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Student Buyer Option */}
            <button
              type="button"
              onClick={() => setRole("BUYER")}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative group flex items-start gap-3 cursor-pointer ${
                role === "BUYER"
                  ? "bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
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
                  Browse listings, save items & place campus orders
                </p>
              </div>
            </button>
            {/* Student Seller / Vendor Option */}
            <button
              type="button"
              onClick={() => setRole("VENDOR")}
              className={`p-3.5 rounded-2xl border text-left transition-all duration-200 relative group flex items-start gap-3 cursor-pointer ${
                role === "VENDOR"
                  ? "bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm"
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
                  Open your verified store, list products & reach students
                </p>
              </div>
            </button>
          </div>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Registration Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">
                Full Name
              </label>
              <Input
                type="text"
                required
                placeholder="e.g. Tobi Adebayo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">
                Email Address
              </label>
              <Input
                type="email"
                required
                placeholder="student@unilag.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">
                Password
              </label>
              <Input
                type="password"
                required
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">
                Phone Number
              </label>
              <Input
                type="tel"
                placeholder="+234 801 234 5678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
            </div>
          </div>

          {/* Vendor Specific Onboarding Fields */}
          {role === "VENDOR" && (
            <div className="pt-4 border-t border-neutral-100 space-y-4 animate-in fade-in-50">
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  Student vendors get a customizable storefront, layout picker,
                  and direct WhatsApp buyer order requests.
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
                    placeholder="+234 802 345 6789"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
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
                  placeholder="Describe the items you sell and your campus delivery schedule..."
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-600/20"
          >
            {loading
              ? "Creating your account..."
              : role === "VENDOR"
                ? "Register Student Store"
                : "Create Buyer Account"}
            <ArrowRight size={18} />
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
