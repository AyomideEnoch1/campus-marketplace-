"use client";

import { useState } from "react";
import { Check, Sparkles, Megaphone, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  initialSettings: Record<string, string>;
}

export function HomepageCmsEditor({ initialSettings }: Props) {
  const [formData, setFormData] = useState({
    hero_badge: initialSettings.hero_badge || "⚡ VERIFIED STUDENT MERCHANTS ONLY",
    hero_title: initialSettings.hero_title || "The Official Multi-Campus Student Marketplace",
    hero_subtitle:
      initialSettings.hero_subtitle ||
      "Buy and sell textbooks, dorm gadgets, fashion, and tech with fellow students at UNILAG, UI, and OAU. Zero listing fees, verified IDs, and instant WhatsApp chat.",
    announcement_bar:
      initialSettings.announcement_bar ||
      "🔥 BACK TO CAMPUS DEALS: Up to 40% OFF Laptops, Textbooks, and Dorm Essentials across all campuses!",
    flash_sale_title:
      initialSettings.flash_sale_title || "FLASH DROP: MID-SEMESTER DORM CLEARANCE",
    flash_sale_subtitle:
      initialSettings.flash_sale_subtitle ||
      "Limited stock items from verified graduating seniors & top campus vendors.",
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/admin/cms/homepage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Announcement Ticker */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <Megaphone className="w-4 h-4" />
            <h3>Top Announcement Banner Ticker</h3>
          </div>
          <p className="text-xs text-neutral-400">
            Displays on the very top of every public page in the marketplace.
          </p>
          <div>
            <input
              type="text"
              value={formData.announcement_bar}
              onChange={(e) =>
                setFormData({ ...formData, announcement_bar: e.target.value })
              }
              className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Hero Section */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
            <Sparkles className="w-4 h-4" />
            <h3>NovaTrend Style Hero Header</h3>
          </div>
          <p className="text-xs text-neutral-400">
            Customize the primary headline, pill tag, and lead copy on the homepage.
          </p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Hero Badge Pill Tag
              </label>
              <input
                type="text"
                value={formData.hero_badge}
                onChange={(e) =>
                  setFormData({ ...formData, hero_badge: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Main Hero Headline
              </label>
              <input
                type="text"
                value={formData.hero_title}
                onChange={(e) =>
                  setFormData({ ...formData, hero_title: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Hero Subtitle Copy
              </label>
              <textarea
                rows={3}
                value={formData.hero_subtitle}
                onChange={(e) =>
                  setFormData({ ...formData, hero_subtitle: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Flash Sale Banner Copy */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
          <h3 className="font-bold text-sm text-white">
            Promotional Drop & Countdown Section
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Section Headline
              </label>
              <input
                type="text"
                value={formData.flash_sale_title}
                onChange={(e) =>
                  setFormData({ ...formData, flash_sale_title: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Section Subtitle
              </label>
              <input
                type="text"
                value={formData.flash_sale_subtitle}
                onChange={(e) =>
                  setFormData({ ...formData, flash_sale_subtitle: e.target.value })
                }
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Bottom Save Bar */}
        <div className="flex items-center justify-between pt-2">
          {success ? (
            <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
              <Check className="w-4 h-4" /> Homepage CMS settings published!
            </span>
          ) : (
            <span className="text-xs text-neutral-500">
              Changes update immediately on the live homepage.
            </span>
          )}

          <Button
            type="submit"
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-6"
          >
            {saving ? "Publishing..." : "Publish Homepage Changes"}
          </Button>
        </div>
      </form>
    </div>
  );
}
