"use client";

import * as React from "react";
import {
  LayoutGrid,
  List,
  Sparkles,
  BookOpen,
  Palette,
  Check,
  Eye,
  Save,
  Image as ImageIcon,
  ExternalLink,
  X,
  ArrowLeft,
  HelpCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SingleImageUpload } from "@/components/ui/single-image-upload";
import { StorefrontRenderer } from "@/components/storefront/StorefrontRenderer";

interface StoreCustomizerClientProps {
  initialVendor: any;
  sampleProducts: any[];
}

export function StoreCustomizerClient({
  initialVendor,
  sampleProducts,
}: StoreCustomizerClientProps) {
  const [storeName, setStoreName] = React.useState(initialVendor.storeName || "");
  const [storeDescription, setStoreDescription] = React.useState(
    initialVendor.storeDescription || ""
  );
  const [whatsapp, setWhatsapp] = React.useState(initialVendor.whatsapp || "");
  const [brandColor, setBrandColor] = React.useState(
    initialVendor.brandColor || "#059669"
  );
  const [layout, setLayout] = React.useState<"grid" | "list" | "showcase" | "lookbook">(
    initialVendor.layout || "grid"
  );
  const [logo, setLogo] = React.useState(initialVendor.logo || "");
  const [banner, setBanner] = React.useState(initialVendor.banner || "");
  const [studentIdUrl, setStudentIdUrl] = React.useState(initialVendor.studentIdUrl || "");
  const [faculty, setFaculty] = React.useState(initialVendor.faculty || "");
  const [department, setDepartment] = React.useState(initialVendor.department || "");

  const [activeTab, setActiveTab] = React.useState<"editor" | "preview">("editor");
  const [saving, setSaving] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [error, setError] = React.useState("");
  const [activeInfoId, setActiveInfoId] = React.useState<string | null>(null);

  // Baseline saved state for dirty tracking
  const [savedState, setSavedState] = React.useState({
    storeName: initialVendor.storeName || "",
    storeDescription: initialVendor.storeDescription || "",
    whatsapp: initialVendor.whatsapp || "",
    brandColor: initialVendor.brandColor || "#059669",
    layout: initialVendor.layout || "grid",
    logo: initialVendor.logo || "",
    banner: initialVendor.banner || "",
    studentIdUrl: initialVendor.studentIdUrl || "",
    faculty: initialVendor.faculty || "",
    department: initialVendor.department || "",
  });

  const isDirty =
    storeName !== savedState.storeName ||
    storeDescription !== savedState.storeDescription ||
    whatsapp !== savedState.whatsapp ||
    brandColor.toLowerCase() !== savedState.brandColor.toLowerCase() ||
    layout !== savedState.layout ||
    (logo || "") !== (savedState.logo || "") ||
    (banner || "") !== (savedState.banner || "") ||
    (studentIdUrl || "") !== (savedState.studentIdUrl || "") ||
    (faculty || "") !== (savedState.faculty || "") ||
    (department || "") !== (savedState.department || "");

  const presetColors = [
    { name: "Campus Emerald", hex: "#059669" },
    { name: "Tech Blue", hex: "#2563EB" },
    { name: "Hostel Purple", hex: "#7C3AED" },
    { name: "Vintage Amber", hex: "#D97706" },
    { name: "Crimson Red", hex: "#DC2626" },
    { name: "Midnight Drip", hex: "#0F172A" },
  ];

  const layoutTemplates = [
    {
      id: "grid",
      title: "1. Classic Grid",
      icon: LayoutGrid,
      description: "Clean, responsive multi-column cards. Best for tech, general products, and large inventories.",
      tag: "Popular",
    },
    {
      id: "list",
      title: "2. Detailed List",
      icon: List,
      description: "Horizontal item rows with detailed specs, tags, and quick-order WhatsApp buttons.",
      tag: "Best for Hostel Gear",
    },
    {
      id: "showcase",
      title: "3. Featured Showcase",
      icon: Sparkles,
      description: "Highlights your #1 top product in a hero spotlight on top, with a grid below.",
      tag: "High Conversion",
    },
    {
      id: "lookbook",
      title: "4. Editorial Lookbook",
      icon: BookOpen,
      description: "Magazine-style large visual cards with aesthetic captions. Perfect for thrift & fashion.",
      tag: "Best for Fashion",
    },
  ];

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSavedSuccess(false);

    try {
      const res = await fetch("/api/vendor/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          storeDescription,
          whatsapp,
          brandColor,
          layout,
          logo: logo || undefined,
          banner: banner || undefined,
          studentIdUrl: studentIdUrl || undefined,
          faculty: faculty || undefined,
          department: department || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update store settings");
      }

      setSavedSuccess(true);
      setSavedState({
        storeName,
        storeDescription,
        whatsapp,
        brandColor,
        layout,
        logo: logo || "",
        banner: banner || "",
        studentIdUrl: studentIdUrl || "",
        faculty: faculty || "",
        department: department || "",
      });
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  // Preview vendor payload
  const previewVendor = {
    ...initialVendor,
    storeName,
    storeDescription,
    whatsapp,
    brandColor,
    layout,
    logo,
    banner,
  };

  return (
    <div className="space-y-6">
      {/* Top Switcher: Settings vs Live Preview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 rounded-2xl bg-neutral-200/80">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab("editor")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === "editor"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            Storefront Settings
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("preview")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === "preview"
                ? "bg-white text-neutral-900 shadow-sm"
                : "text-neutral-600 hover:text-neutral-900"
            }`}
          >
            <Eye className="w-3.5 h-3.5 text-emerald-600" />
            Live Preview ({layout.toUpperCase()})
          </button>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <Check className="w-4 h-4" /> Changes Saved!
            </span>
          )}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!isDirty || saving}
            className={`font-bold gap-2 text-xs transition-all ${
              !isDirty || saving
                ? "bg-neutral-200 text-neutral-400 border border-neutral-200 cursor-not-allowed shadow-none"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20 cursor-pointer"
            }`}
          >
            <Save className="w-3.5 h-3.5" />
            {saving ? "Saving..." : "Save Store Customization"}
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* TAB 1: EDITOR */}
      {activeTab === "editor" && (
        <div className="space-y-8 animate-in fade-in-50">
          {/* 1. SELECT STOREFRONT LAYOUT (Section 4.4) */}
          <div className="p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-neutral-900">
                1. Select Storefront Layout Template
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Switch between the 4 templates in real time. Your products and brand colors adapt instantly.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {layoutTemplates.map((tpl) => {
                const Icon = tpl.icon;
                const isSelected = layout === tpl.id;
                const isInfoOpen = activeInfoId === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => setLayout(tpl.id as any)}
                    className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative group flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20"
                        : "border-neutral-200 hover:border-neutral-300 bg-white"
                    }`}
                  >
                    {/* Top Row: Title, Tag, and Mobile (?) Tooltip Button (Icon removed from top-left) */}
                    <div className="flex items-center justify-between gap-1.5">
                      <h4 className="font-bold text-sm text-neutral-950 truncate">
                        {tpl.title}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Badge
                          variant={isSelected ? "default" : "secondary"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {tpl.tag}
                        </Badge>
                        {/* Mobile ? Help Button */}
                        <button
                          type="button"
                          aria-label={`Description for ${tpl.title}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveInfoId(isInfoOpen ? null : tpl.id);
                          }}
                          className="w-5 h-5 rounded-full bg-neutral-100 hover:bg-neutral-200 text-neutral-600 flex items-center justify-center text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          ?
                        </button>
                      </div>
                    </div>

                    {/* Middle: Icon moved into the space previously occupied by description */}
                    <div
                      title={tpl.description}
                      className="py-5 flex flex-col items-center justify-center relative group/icon"
                    >
                      <div
                        className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all group-hover/icon:scale-105 ${
                          isSelected
                            ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"
                            : "bg-neutral-100 text-neutral-600 group-hover:bg-neutral-200"
                        }`}
                      >
                        <Icon className="w-7 h-7" />
                      </div>

                      {/* Desktop Hover Tooltip */}
                      <div className="hidden lg:group-hover:block absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-full w-56 p-2.5 rounded-xl bg-neutral-900 text-white text-[11px] leading-relaxed shadow-xl z-30 pointer-events-none animate-in fade-in-50">
                        {tpl.description}
                      </div>
                    </div>

                    {/* Mobile Info Popover (with close button) */}
                    {isInfoOpen && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute inset-x-2 top-2 p-3 rounded-xl bg-neutral-900 text-white text-xs shadow-2xl z-40 space-y-2 animate-in fade-in zoom-in-95"
                      >
                        <div className="flex items-center justify-between pb-1 border-b border-neutral-700">
                          <span className="font-bold text-[11px] text-emerald-400">
                            {tpl.title}
                          </span>
                          <button
                            type="button"
                            onClick={() => setActiveInfoId(null)}
                            className="p-1 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <p className="text-[11px] leading-relaxed text-neutral-300">
                          {tpl.description}
                        </p>
                      </div>
                    )}

                    {/* Bottom: Selection checkmark (Removed 'Active Layout' and 'Select Layout' labels) */}
                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-end h-6">
                      {isSelected ? (
                        <div className="flex items-center gap-1 text-emerald-600 font-bold text-xs">
                          <Check className="w-4 h-4 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-3.5 h-3.5 rounded-full border border-neutral-300" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2. BRAND COLOR & THEME */}
          <div className="p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-neutral-900">
                2. Brand Color Palette
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Applied to your store header, Chat CTA buttons, and highlighted badges
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {presetColors.map((color) => (
                <button
                  key={color.hex}
                  type="button"
                  onClick={() => setBrandColor(color.hex)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-bold transition-all ${
                    brandColor.toLowerCase() === color.hex.toLowerCase()
                      ? "border-neutral-900 ring-2 ring-neutral-900/10 shadow-xs"
                      : "border-neutral-200 hover:border-neutral-300"
                  }`}
                >
                  <span
                    className="w-4 h-4 rounded-full shadow-inner"
                    style={{ backgroundColor: color.hex }}
                  />
                  <span>{color.name}</span>
                </button>
              ))}

              <div className="flex items-center gap-2 pl-2 border-l border-neutral-200">
                <span className="text-xs text-neutral-500 font-medium">Custom Hex:</span>
                <input
                  type="color"
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-neutral-200 cursor-pointer"
                />
                <Input
                  value={brandColor}
                  onChange={(e) => setBrandColor(e.target.value)}
                  className="w-24 h-8 text-xs font-mono"
                  placeholder="#059669"
                />
              </div>
            </div>
          </div>

          {/* 3. LOGO & BANNER ASSETS */}
          <div className="p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
            <div>
              <h3 className="font-extrabold text-base text-neutral-900">
                3. Store Identity & Visual Assets
              </h3>
              <p className="text-xs text-neutral-500 mt-0.5">
                Upload or link your store avatar and wide header banner image
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <SingleImageUpload
                value={logo}
                onChange={setLogo}
                aspectRatio="square"
                folder="stores"
                label="Store Logo / Profile Avatar"
                hint="400x400px square format"
              />

              <SingleImageUpload
                value={banner}
                onChange={setBanner}
                aspectRatio="banner"
                folder="stores"
                label="Store Header Banner"
                hint="1200x400px wide landscape format"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-3">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700">Store Name</label>
                <Input
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="text-xs font-bold"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700">Order WhatsApp Number</label>
                <Input
                  value={whatsapp}
                  onChange={(e) => setWhatsapp(e.target.value)}
                  className="text-xs font-bold"
                />
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-neutral-700">Store Bio / Description</label>
              <textarea
                rows={3}
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-xs text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                placeholder="Describe your student store..."
              />
            </div>
          </div>

          {/* 4. IDENTITY & STUDENT VERIFICATION */}
          <div className="p-6 rounded-3xl bg-white border border-neutral-200/80 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-100">
              <div>
                <h3 className="font-extrabold text-base text-neutral-900 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <span>4. Identity &amp; Student Verification</span>
                </h3>
                <p className="text-xs text-neutral-500 mt-0.5">
                  Verified campus student vendors receive verified badges, increased buyer trust, and priority campus search ranking.
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant={
                    initialVendor.status === "APPROVED"
                      ? "default"
                      : initialVendor.status === "REJECTED"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs px-2.5 py-1 font-bold"
                >
                  {initialVendor.status === "APPROVED"
                    ? "Tier 2 Verified Student"
                    : initialVendor.status === "REJECTED"
                    ? "Verification Rejected"
                    : "Awaiting Admin Review"}
                </Badge>
              </div>
            </div>

            {/* Status notice */}
            {initialVendor.status === "APPROVED" ? (
              <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 text-xs flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Store Verified by Campus Administration</p>
                  <p className="text-emerald-700 mt-0.5">
                    Your student merchant identity is active. All your published listings are live for students across your university.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900 text-xs flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Pending Campus Admin Verification</p>
                  <p className="text-amber-800 mt-0.5">
                    Upload your valid university Student ID Card below. Campus trade administrators will review your student status in the admin directory and approve your store.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700">Faculty / College</label>
                <Input
                  value={faculty}
                  onChange={(e) => setFaculty(e.target.value)}
                  placeholder="e.g. Faculty of Engineering"
                  className="text-xs"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700">Department</label>
                <Input
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="e.g. Computer Science"
                  className="text-xs"
                />
              </div>
            </div>

            {/* Student ID Card Upload */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-neutral-700">
                  Student ID Card Document (Photo / Scan)
                </label>
                <span className="text-[11px] text-neutral-400">
                  Encrypted &bull; Visible only to campus administrators
                </span>
              </div>
              <SingleImageUpload
                value={studentIdUrl}
                onChange={(url) => setStudentIdUrl(url)}
                folder="stores"
                label="Upload University Student ID Card"
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LIVE STOREFRONT PREVIEW */}
      {activeTab === "preview" && (
        <div className="rounded-3xl border-2 border-neutral-300 overflow-hidden shadow-2xl bg-white animate-in zoom-in-95">
          <div className="bg-neutral-900 text-white px-4 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-3">
              <Link
                href="/dashboard"
                className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-white font-bold text-[11px] flex items-center gap-1.5 transition-colors border border-neutral-700 shrink-0"
              >
                <ArrowLeft className="w-3 h-3 text-emerald-400" />
                <span>Back to Overview</span>
              </Link>
              <span className="font-bold flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Preview &bull; Template:{" "}
                <span className="text-emerald-400 uppercase font-black">{layout}</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLayout("grid")}
                className={`px-2 py-1 rounded text-[10px] font-bold ${layout === "grid" ? "bg-white text-black" : "text-neutral-400"}`}
              >
                Grid
              </button>
              <button
                type="button"
                onClick={() => setLayout("list")}
                className={`px-2 py-1 rounded text-[10px] font-bold ${layout === "list" ? "bg-white text-black" : "text-neutral-400"}`}
              >
                List
              </button>
              <button
                type="button"
                onClick={() => setLayout("showcase")}
                className={`px-2 py-1 rounded text-[10px] font-bold ${layout === "showcase" ? "bg-white text-black" : "text-neutral-400"}`}
              >
                Showcase
              </button>
              <button
                type="button"
                onClick={() => setLayout("lookbook")}
                className={`px-2 py-1 rounded text-[10px] font-bold ${layout === "lookbook" ? "bg-white text-black" : "text-neutral-400"}`}
              >
                Lookbook
              </button>
            </div>
          </div>

          <StorefrontRenderer
            vendor={previewVendor}
            products={sampleProducts}
            isPreview={true}
          />
        </div>
      )}
    </div>
  );
}
