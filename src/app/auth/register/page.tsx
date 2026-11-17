"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GraduationCap, Store, UserCheck, ShieldCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

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

  const [campuses, setCampuses] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  React.useEffect(() => {
    // Load active campuses
    fetch("/api/campuses")
      .then((res) => res.json())
      .then((data) => {
        if (data.campuses && data.campuses.length > 0) {
          setCampuses(data.campuses);
          setCampusId(data.campuses[0].id);
        }
      })
      .catch(() => {});
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (!phone.trim() || phone.trim().length < 7) {
      setError("Please enter a valid phone number (at least 7 digits).");
      return;
    }

    if (role === "VENDOR") {
      if (!storeName.trim()) {
        setError("Please enter a store name for your campus shop.");
        return;
      }
      if (!whatsapp.trim() && !phone.trim()) {
        setError("Please enter a WhatsApp contact number for receiving orders.");
        return;
      }
    }

    setLoading(true);

    try {
      const payload: any = {
        fullName: fullName.trim(),
        email: email.trim().toLowerCase(),
        password,
        phone: phone.trim(),
        role,
      };

      if (role === "VENDOR") {
        payload.storeName = storeName.trim();
        payload.campusId = campusId;
        payload.whatsapp = (whatsapp || phone).trim();
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

      router.push(data.redirectTo || "/shop");
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Failed to register. Please check your information.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 bg-neutral-50/70">
      <div className="w-full max-w-lg bg-white rounded-3xl border border-neutral-100 shadow-xl p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <Link href="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-600/30">
              <GraduationCap className="w-6 h-6" />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-neutral-900">
              Campus<span className="text-emerald-600">Trade</span>
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold text-neutral-900">Join CampusTrade</h1>
          <p className="text-xs text-neutral-500">
            Create your account to start buying or launch your verified campus store
          </p>
        </div>

        {/* Role Toggle Selector */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-neutral-100">
          <button
            type="button"
            onClick={() => setRole("BUYER")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === "BUYER"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <UserCheck className="w-4 h-4 text-emerald-600" />
            Student Buyer
          </button>
          <button
            type="button"
            onClick={() => setRole("VENDOR")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
              role === "VENDOR"
                ? "bg-white text-neutral-950 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800"
            }`}
          >
            <Store className="w-4 h-4 text-emerald-600" />
            Student Seller / Vendor
          </button>
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
              <label className="text-xs font-bold text-neutral-700">Full Name *</label>
              <Input
                type="text"
                required
                maxLength={70}
                placeholder="e.g. Tobi Adebayo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Email Address *</label>
              <Input
                type="email"
                required
                maxLength={100}
                placeholder="student@unilag.edu.ng"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Password (min 6 chars) *</label>
              <Input
                type="password"
                required
                minLength={6}
                maxLength={64}
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Phone Number *</label>
              <Input
                type="tel"
                required
                minLength={7}
                maxLength={15}
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
                  Student vendors get a customizable storefront, layout picker, and direct WhatsApp buyer order requests.
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Store Name *</label>
                  <Input
                    type="text"
                    required
                    maxLength={60}
                    placeholder="e.g. Unilag Drip Corner"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Campus Location *</label>
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
                        <option value="unilag">University of Lagos (UNILAG)</option>
                        <option value="ui">University of Ibadan (UI)</option>
                        <option value="oau">Obafemi Awolowo University (OAU)</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">WhatsApp for Orders *</label>
                  <Input
                    type="tel"
                    required
                    minLength={7}
                    maxLength={15}
                    placeholder="+234 802 345 6789"
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">Faculty / Department</label>
                  <Input
                    type="text"
                    maxLength={60}
                    placeholder="e.g. Engineering / Electrical"
                    value={faculty}
                    onChange={(e) => setFaculty(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Store Short Bio</label>
                <textarea
                  maxLength={400}
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
            disabled={
              loading ||
              !fullName.trim() ||
              !email.trim() ||
              !email.includes("@") ||
              password.length < 6 ||
              phone.trim().length < 7 ||
              (role === "VENDOR" && (!storeName.trim() || (!whatsapp.trim() && !phone.trim())))
            }
            className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-2xl shadow-md shadow-emerald-600/20 transition-all inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-white" />
                <span>{role === "VENDOR" ? "Registering Store..." : "Creating Account..."}</span>
              </>
            ) : role === "VENDOR" ? (
              "Register Student Store →"
            ) : (
              "Create Buyer Account →"
            )}
          </Button>
        </form>

        {/* Login Prompt */}
        <div className="pt-2 text-center text-xs text-neutral-500">
          Already have an account?{" "}
          <Link href="/auth/login" className="font-bold text-emerald-600 hover:underline">
            Sign In here
          </Link>
        </div>

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
