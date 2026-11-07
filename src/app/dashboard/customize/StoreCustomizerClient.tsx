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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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

  const [activeTab, setActiveTab] = React.useState<"editor" | "preview">("editor");
  const [saving, setSaving] = React.useState(false);
  const [savedSuccess, setSavedSuccess] = React.useState(false);
  const [error, setError] = React.useState("");

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
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update store settings");
      }

      setSavedSuccess(true);
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
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold gap-2 text-xs shadow-md shadow-emerald-600/20"
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
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setLayout(tpl.id as any)}
                    className={`p-5 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                      isSelected
                        ? "border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-500/20"
                        : "border-neutral-200 hover:border-neutral-300 bg-white"
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            isSelected
                              ? "bg-emerald-600 text-white"
                              : "bg-neutral-100 text-neutral-600"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <Badge
                          variant={isSelected ? "default" : "secondary"}
                          className="text-[10px]"
                        >
                          {tpl.tag}
                        </Badge>
                      </div>
                      <h4 className="font-bold text-sm text-neutral-950">
                        {tpl.title}
                      </h4>
                      <p className="text-xs text-neutral-500 leading-snug">
                        {tpl.description}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-neutral-100 flex items-center justify-between text-xs">
                      <span className={`font-semibold ${isSelected ? "text-emerald-700 font-bold" : "text-neutral-400"}`}>
                        {isSelected ? "Active Layout" : "Select Layout"}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
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
                Applied to your store header, WhatsApp CTA buttons, and highlighted badges
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
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700">Logo Image URL</label>
                <Input
                  placeholder="https://example.com/logo.jpg"
                  value={logo}
                  onChange={(e) => setLogo(e.target.value)}
                  className="text-xs"
                />
                <p className="text-[11px] text-neutral-400">
                  Recommended: 400x400px square format
                </p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-700">Banner Image URL</label>
                <Input
                  placeholder="https://example.com/banner.jpg"
                  value={banner}
                  onChange={(e) => setBanner(e.target.value)}
                  className="text-xs"
                />
                <p className="text-[11px] text-neutral-400">
                  Recommended: 1200x400px wide landscape format
                </p>
              </div>
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
        </div>
      )}

      {/* TAB 2: LIVE STOREFRONT PREVIEW */}
      {activeTab === "preview" && (
        <div className="rounded-3xl border-2 border-neutral-300 overflow-hidden shadow-2xl bg-white animate-in zoom-in-95">
          <div className="bg-neutral-900 text-white px-4 py-2.5 flex items-center justify-between text-xs">
            <span className="font-bold flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Storefront Preview &bull; Template:{" "}
              <span className="text-emerald-400 uppercase font-black">{layout}</span>
            </span>
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
