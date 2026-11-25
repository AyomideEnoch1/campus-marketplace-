"use client";

import { useState } from "react";
import { Sliders, ShieldCheck, Percent, Phone, Globe, Check, CreditCard, Banknote, Ticket, Lock, Unlock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatNGN } from "@/lib/utils";
import { toast } from "sonner";

interface Props {
  initialSettings: Record<string, string>;
}

export function SettingsForm({ initialSettings }: Props) {
  const [formData, setFormData] = useState({
    site_name: initialSettings.site_name || "ọjà Nigeria",
    brand_primary_color: initialSettings.brand_primary_color || "#059669",
    support_phone: initialSettings.support_phone || "+234 812 345 6789",
    support_email: initialSettings.support_email || "support@campustrade.ng",
    require_vendor_approval: initialSettings.require_vendor_approval ?? "true",
    commission_percent: initialSettings.commission_percent || "5.0",
    vendor_access_fee: initialSettings.vendor_access_fee || "15000",
    vendor_access_duration_days: initialSettings.vendor_access_duration_days || "365",
    require_vendor_payment: initialSettings.require_vendor_payment ?? "true",
    enable_standard_vendor_access: initialSettings.enable_standard_vendor_access ?? "true",
    enable_founding_vendor_coupon: initialSettings.enable_founding_vendor_coupon ?? "true",
    enable_flutterwave_checkout:
      initialSettings.enable_flutterwave_checkout ??
      (process.env.NEXT_PUBLIC_FLUTTERWAVE_LOCKED === "false" ? "true" : "false"),
    seo_meta_title:
      initialSettings.seo_meta_title ||
      "ọjà — Multi-Campus Student Marketplace",
    seo_meta_description:
      initialSettings.seo_meta_description ||
      "Buy & sell textbooks, electronics, dorm essentials, and fashion on Nigerian university campuses with instant WhatsApp checkout.",
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSuccess(true);
        toast.success("Platform settings saved successfully!");
        setTimeout(() => setSuccess(false), 3000);
      } else {
        toast.error("Failed to save settings.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error saving settings.");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickToggle = async (key: string, nextValue: string, label: string) => {
    setFormData((prev) => ({ ...prev, [key]: nextValue }));
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [key]: nextValue }),
      });
      if (res.ok) {
        toast.success(`${label} updated: ${nextValue === "true" ? "ACTIVE / ON" : "PAUSED / OFF"}`);
      } else {
        toast.error(`Failed to update ${label}`);
      }
    } catch {
      toast.error(`Network error updating ${label}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Brand & Identity */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Globe className="w-4 h-4 text-emerald-400" />
          General Platform Identity
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Platform Name
            </label>
            <input
              type="text"
              required
              value={formData.site_name}
              onChange={(e) =>
                setFormData({ ...formData, site_name: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Primary Brand Hex Color
            </label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={formData.brand_primary_color}
                onChange={(e) =>
                  setFormData({ ...formData, brand_primary_color: e.target.value })
                }
                className="w-9 h-9 rounded-lg bg-neutral-950 border border-neutral-800 cursor-pointer p-0.5"
              />
              <input
                type="text"
                value={formData.brand_primary_color}
                onChange={(e) =>
                  setFormData({ ...formData, brand_primary_color: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white uppercase font-mono focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Support & Contact */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <Phone className="w-4 h-4 text-blue-400" />
          Official Contact & WhatsApp
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Support / Helpline WhatsApp Number
            </label>
            <input
              type="text"
              required
              value={formData.support_phone}
              onChange={(e) =>
                setFormData({ ...formData, support_phone: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Official Support Email
            </label>
            <input
              type="email"
              required
              value={formData.support_email}
              onChange={(e) =>
                setFormData({ ...formData, support_email: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Policy & Onboarding Rules */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-sm text-white flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-amber-400" />
          Vendor Onboarding & Commission Policies
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="flex items-start gap-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800">
            <input
              type="checkbox"
              id="reqApproval"
              checked={formData.require_vendor_approval === "true"}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  require_vendor_approval: e.target.checked ? "true" : "false",
                })
              }
              className="w-4 h-4 mt-1 rounded text-emerald-600 focus:ring-emerald-500 bg-neutral-900 border-neutral-700"
            />
            <div>
              <label
                htmlFor="reqApproval"
                className="text-xs font-bold text-white block cursor-pointer"
              >
                Require Admin Approval for New Vendors
              </label>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                When enabled, newly registered vendors must have their student ID verified by an admin before their store and listings go live.
              </p>
            </div>
          </div>

          <div className="p-4 bg-neutral-950 rounded-xl border border-neutral-800">
            <label className="text-xs font-bold text-white block mb-1 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-purple-400" />
              Platform Commission Rate (%)
            </label>
            <input
              type="number"
              step="0.5"
              min="0"
              max="30"
              value={formData.commission_percent}
              onChange={(e) =>
                setFormData({ ...formData, commission_percent: e.target.value })
              }
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-neutral-400 mt-1">
              Used for future Paystack automated transaction fee split (Phase 2).
            </p>
          </div>
        </div>
      </div>

      {/* Flutterwave Live Payment Gateway & Checkout Restriction */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            Flutterwave Live Checkout &amp; Transaction Restrictions
          </h3>
          <span className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg border ${
            formData.enable_flutterwave_checkout === "true"
              ? "text-emerald-400 bg-emerald-950/80 border-emerald-800"
              : "text-amber-400 bg-amber-950/80 border-amber-800"
          }`}>
            {formData.enable_flutterwave_checkout === "true" ? "Live Gateway Active" : "Locked (Onboarding Mode)"}
          </span>
        </div>
        <p className="text-xs text-neutral-400">
          Controls whether buyers can make automated live payments (debit card, bank transfer, USSD) via Flutterwave or if the onboarding locked modal is displayed.
        </p>

        <div className="flex items-start gap-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800">
          <input
            type="checkbox"
            id="enableFlutterwaveCheckout"
            checked={formData.enable_flutterwave_checkout === "true"}
            onChange={(e) => {
              const nextVal = e.target.checked ? "true" : "false";
              handleQuickToggle("enable_flutterwave_checkout", nextVal, "Flutterwave Live Checkout");
            }}
            className="w-4 h-4 mt-1 rounded text-emerald-600 focus:ring-emerald-500 bg-neutral-900 border-neutral-700 cursor-pointer"
          />
          <div>
            <label
              htmlFor="enableFlutterwaveCheckout"
              className="text-xs font-bold text-white block cursor-pointer flex items-center gap-1.5"
            >
              {formData.enable_flutterwave_checkout === "true" ? (
                <Unlock className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-amber-400" />
              )}
              Unlock Live Online Checkout via Flutterwave
            </label>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              When <strong>enabled (Checked)</strong>, buyers can seamlessly pay with debit cards and bank transfers via Flutterwave with automated escrow holding. When <strong>disabled (Unchecked)</strong>, the compliance onboarding modal is displayed encouraging buyers to use Pay-on-Delivery or in-app chat.
            </p>
          </div>
        </div>
      </div>

      {/* Vendor Storefront Access & Subscription Pricing */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-emerald-400" />
            Standard Vendor Storefront Access Pricing
          </h3>
          <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-lg border border-emerald-800">
            Preview: {formatNGN(Number(formData.vendor_access_fee) || 0)} / {formData.vendor_access_duration_days || "365"} Days
          </span>
        </div>
        <p className="text-xs text-neutral-400">
          This controls the public subscription fee displayed on the vendor activation screen (<code>/dashboard/activate</code>) when vendors activate access without a free Founding Coupon.
        </p>

        {/* Global Paywall Toggle */}
        <div className="flex items-start gap-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800">
          <input
            type="checkbox"
            id="reqVendorPayment"
            checked={formData.require_vendor_payment === "true"}
            onChange={(e) => {
              const nextVal = e.target.checked ? "true" : "false";
              handleQuickToggle("require_vendor_payment", nextVal, "Vendor Payment Paywall");
            }}
            className="w-4 h-4 mt-1 rounded text-emerald-600 focus:ring-emerald-500 bg-neutral-900 border-neutral-700 cursor-pointer"
          />
          <div>
            <label
              htmlFor="reqVendorPayment"
              className="text-xs font-bold text-white block cursor-pointer"
            >
              Enforce Vendor Storefront Payment Restriction (Paywall)
            </label>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              When <strong>enabled</strong>, vendors must either pay the storefront access fee or redeem a valid founding coupon before they can publish listings. When <strong>disabled</strong> (Free Access), all approved vendors can create and publish listings without paying any storefront fee.
            </p>
          </div>
        </div>

        {/* Activation Method Feature Toggles */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Standard Vendor Access (Paid) Toggle */}
          <div className="flex items-start gap-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800">
            <input
              type="checkbox"
              id="enableStandardAccess"
              checked={formData.enable_standard_vendor_access === "true"}
              onChange={(e) => {
                const nextVal = e.target.checked ? "true" : "false";
                handleQuickToggle("enable_standard_vendor_access", nextVal, "Standard Vendor Access (Paid Plan)");
              }}
              className="w-4 h-4 mt-1 rounded text-emerald-600 focus:ring-emerald-500 bg-neutral-900 border-neutral-700 cursor-pointer"
            />
            <div>
              <label
                htmlFor="enableStandardAccess"
                className="text-xs font-bold text-white block cursor-pointer flex items-center gap-1.5"
              >
                <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                Standard Vendor Access (Paid Plan)
              </label>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                When <strong>enabled</strong>, vendors can pay the storefront access fee via card, bank transfer, or USSD on <code>/dashboard/activate</code>. When <strong>disabled</strong>, the paid card is hidden and payment activation is blocked.
              </p>
            </div>
          </div>

          {/* Founding Vendor Coupon Toggle */}
          <div className="flex items-start gap-3 p-4 bg-neutral-950 rounded-xl border border-neutral-800">
            <input
              type="checkbox"
              id="enableFoundingCoupon"
              checked={formData.enable_founding_vendor_coupon === "true"}
              onChange={(e) => {
                const nextVal = e.target.checked ? "true" : "false";
                handleQuickToggle("enable_founding_vendor_coupon", nextVal, "Founding Vendor Coupons");
              }}
              className="w-4 h-4 mt-1 rounded text-emerald-600 focus:ring-emerald-500 bg-neutral-900 border-neutral-700 cursor-pointer"
            />
            <div>
              <label
                htmlFor="enableFoundingCoupon"
                className="text-xs font-bold text-white block cursor-pointer flex items-center gap-1.5"
              >
                <Ticket className="w-3.5 h-3.5 text-purple-400" />
                Founding Vendor Coupon Codes
              </label>
              <p className="text-[11px] text-neutral-400 mt-0.5">
                When <strong>enabled</strong>, vendors can apply promotional Founding Vendor coupon codes for free access on <code>/dashboard/activate</code>. When <strong>disabled</strong>, coupon input is hidden and code redemption is rejected.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Standard Access Fee in Naira (₦)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 font-bold text-xs">₦</span>
              <input
                type="number"
                min="0"
                step="500"
                required
                value={formData.vendor_access_fee}
                onChange={(e) =>
                  setFormData({ ...formData, vendor_access_fee: e.target.value })
                }
                className="w-full pl-8 pr-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 font-mono font-bold focus:outline-none focus:border-emerald-500"
                placeholder="15000"
              />
            </div>
            <p className="text-[11px] text-neutral-500 mt-1">
              Currently set to {formatNGN(Number(formData.vendor_access_fee) || 0)}.
            </p>
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Access Validity Duration (Days)
            </label>
            <input
              type="number"
              min="1"
              max="1825"
              required
              value={formData.vendor_access_duration_days}
              onChange={(e) =>
                setFormData({ ...formData, vendor_access_duration_days: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 font-mono focus:outline-none focus:border-emerald-500"
              placeholder="365"
            />
            <p className="text-[11px] text-neutral-500 mt-1">
              Default is 365 days (1 year access).
            </p>
          </div>
        </div>
      </div>

      {/* SEO Defaults */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
        <h3 className="font-bold text-sm text-white">Default SEO & Meta Tags</h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Global Title Template
            </label>
            <input
              type="text"
              value={formData.seo_meta_title}
              onChange={(e) =>
                setFormData({ ...formData, seo_meta_title: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-neutral-300 block mb-1">
              Global Meta Description
            </label>
            <textarea
              rows={2}
              value={formData.seo_meta_description}
              onChange={(e) =>
                setFormData({ ...formData, seo_meta_description: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-between pt-2">
        {success ? (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
            <Check className="w-4 h-4" /> Platform settings updated successfully!
          </span>
        ) : (
          <span className="text-xs text-neutral-500">
            Settings take effect immediately platform-wide.
          </span>
        )}

        <Button
          type="submit"
          disabled={saving}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6"
        >
          {saving ? "Saving..." : "Save Settings"}
        </Button>
      </div>
    </form>
  );
}
