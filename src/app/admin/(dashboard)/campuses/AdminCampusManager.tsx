"use client";

import { useState } from "react";
import Link from "next/link";
import {
  MapPin,
  Plus,
  CheckCircle,
  EyeOff,
  Trash2,
  ExternalLink,
  Users,
  Store,
  GraduationCap,
  ShieldAlert,
  ShieldCheck,
  Settings,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface SafeMeetupPointItem {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
}

interface CampusSettingItem {
  id: string;
  guestVendorsEnabled: boolean;
  guestVendorCap: number;
}

interface CampusItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  state?: string | null;
  isActive: boolean;
  studentCount?: number;
  guestCount?: number;
  settings?: CampusSettingItem | null;
  safeMeetupPoints?: SafeMeetupPointItem[];
  _count: { vendors: number };
}

export function AdminCampusManager({
  initialCampuses,
}: {
  initialCampuses: CampusItem[];
}) {
  const [campuses, setCampuses] = useState(initialCampuses);
  const [isCreating, setIsCreating] = useState(false);
  const [editingSettingsId, setEditingSettingsId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Edit settings form state
  const [settingsGuestEnabled, setSettingsGuestEnabled] = useState(true);
  const [settingsGuestCap, setSettingsGuestCap] = useState(25);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug) {
      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/campuses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, slug, city, state }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create campus");

      window.location.reload();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/campuses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setCampuses((prev) =>
          prev.map((c) => (c.id === id ? { ...c, isActive: !current } : c))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openSettingsModal = (campus: CampusItem) => {
    setEditingSettingsId(campus.id);
    setSettingsGuestEnabled(campus.settings?.guestVendorsEnabled ?? true);
    setSettingsGuestCap(campus.settings?.guestVendorCap ?? 25);
  };

  const handleSaveSettings = async (campusId: string) => {
    setIsSavingSettings(true);
    try {
      const res = await fetch(`/api/admin/campuses/${campusId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guestVendorsEnabled: settingsGuestEnabled,
          guestVendorCap: settingsGuestCap,
        }),
      });

      if (res.ok) {
        setCampuses((prev) =>
          prev.map((c) =>
            c.id === campusId
              ? {
                  ...c,
                  settings: {
                    id: c.settings?.id || "",
                    guestVendorsEnabled: settingsGuestEnabled,
                    guestVendorCap: settingsGuestCap,
                  },
                }
              : c
          )
        );
        setEditingSettingsId(null);
      }
    } catch (err) {
      console.error("Failed to save settings", err);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleSuspendGuests = async (campus: CampusItem) => {
    if (
      !confirm(
        `Suspend ALL active Guest Vendors on ${campus.name}? Student vendors will remain completely unaffected.`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/campuses/${campus.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suspendGuestVendors: true }),
      });
      if (res.ok) {
        alert(`Guest vendors on ${campus.name} have been suspended.`);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReactivateGuests = async (campus: CampusItem) => {
    if (
      !confirm(
        `Reactivate suspended Guest Vendors on ${campus.name}?`
      )
    )
      return;

    try {
      const res = await fetch(`/api/admin/campuses/${campus.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reactivateGuestVendors: true }),
      });
      if (res.ok) {
        alert(`Guest vendors on ${campus.name} have been reactivated.`);
        window.location.reload();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete campus "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/campuses/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete");
        return;
      }
      setCampuses((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400">
          Control campus onboarding, guest seller caps, and campus-wide safe meetup fulfillment rules.
        </p>
        <Button
          onClick={() => setIsCreating(true)}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Campus
        </Button>
      </div>

      {/* Creation Drawer */}
      {isCreating && (
        <div className="bg-neutral-900 border border-emerald-500/40 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="font-bold text-sm text-white">Add New Campus</h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          {errorMsg && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Campus Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. University of Benin (UNIBEN)"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Campus Slug
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. uniben"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  City / Town
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Benin City"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  State
                </label>
                <input
                  type="text"
                  placeholder="e.g. Edo State"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreating(false)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                {isSubmitting ? "Saving..." : "Save Campus"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Campus Grid Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {campuses.map((campus) => {
          const guestEnabled = campus.settings?.guestVendorsEnabled ?? true;
          const guestCap = campus.settings?.guestVendorCap ?? 25;
          const guestCount = campus.guestCount ?? 0;
          const isCapFull = guestCount >= guestCap;

          return (
            <div
              key={campus.id}
              className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors space-y-4"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex items-center gap-1.5">
                    {campus.isActive ? (
                      <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800 text-[10px]">
                        Active
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-[10px] text-neutral-500">
                        Inactive
                      </Badge>
                    )}

                    {guestEnabled ? (
                      <Badge className="bg-purple-950 text-purple-300 border border-purple-800 text-[10px]">
                        Guests Allowed
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-950 text-amber-400 border border-amber-800 text-[10px]">
                        Student-Only
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="font-bold text-sm text-white line-clamp-1">
                    {campus.name}
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {campus.city}{campus.state ? `, ${campus.state}` : ""}
                  </p>
                  <p className="text-[11px] font-mono text-neutral-500 mt-0.5">
                    slug: /{campus.slug}
                  </p>
                </div>

                {/* Seller Type Breakdown & Cap Stats */}
                <div className="mt-4 pt-3 border-t border-neutral-800/60 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2 bg-neutral-950/60 p-2.5 rounded-xl border border-neutral-800">
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <GraduationCap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span><strong>{campus.studentCount ?? 0}</strong> Students</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-neutral-300">
                      <Store className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span>
                        <strong>{guestCount}</strong> / {guestCap} Guests
                      </span>
                    </div>
                  </div>

                  {isCapFull && (
                    <p className="text-[10px] text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Guest registration cap reached for this campus
                    </p>
                  )}

                  {campus.safeMeetupPoints && (
                    <p className="text-[11px] text-neutral-400 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-purple-400" />
                      {campus.safeMeetupPoints.length} Designated Safe Meetup Zones
                    </p>
                  )}
                </div>
              </div>

              {/* Campus Controls & Actions */}
              <div className="pt-3 border-t border-neutral-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <button
                    onClick={() => openSettingsModal(campus)}
                    className="text-purple-400 hover:text-purple-300 flex items-center gap-1 font-semibold text-xs"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Guest Policy & Cap</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggleActive(campus.id, campus.isActive)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                      title={campus.isActive ? "Deactivate Campus" : "Activate Campus"}
                    >
                      {campus.isActive ? (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <EyeOff className="w-3.5 h-3.5 text-neutral-500" />
                      )}
                    </button>
                    <button
                      onClick={() => handleDelete(campus.id, campus.name)}
                      className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950/80 hover:text-red-400 text-neutral-500"
                      title="Delete campus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Targeted Guest Vendor Action */}
                <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/40">
                  <button
                    onClick={() => handleSuspendGuests(campus)}
                    className="text-[11px] text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1"
                  >
                    <ShieldAlert className="w-3 h-3" />
                    Suspend Guests Only
                  </button>
                  <span className="text-neutral-700">&bull;</span>
                  <button
                    onClick={() => handleReactivateGuests(campus)}
                    className="text-[11px] text-emerald-400 hover:text-emerald-300 hover:underline"
                  >
                    Reactivate
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Settings Modal */}
      {editingSettingsId && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="font-bold text-base text-white">Campus Guest Vendor Settings</h3>
              <button
                onClick={() => setEditingSettingsId(null)}
                className="text-neutral-400 hover:text-white text-xs"
              >
                &times; Close
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <label className="flex items-center justify-between p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 cursor-pointer">
                <div>
                  <span className="font-bold text-white block">Allow Guest Vendors</span>
                  <span className="text-neutral-400 text-[11px]">
                    If disabled, this campus stays student-only.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settingsGuestEnabled}
                  onChange={(e) => setSettingsGuestEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-purple-600 focus:ring-purple-500"
                />
              </label>

              <div>
                <label className="font-bold text-neutral-300 block mb-1">
                  Active Guest Vendor Limit / Cap
                </label>
                <input
                  type="number"
                  min={1}
                  max={500}
                  value={settingsGuestCap}
                  onChange={(e) => setSettingsGuestCap(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-purple-500"
                />
                <span className="text-neutral-500 text-[11px] mt-1 block">
                  Registration for guests is automatically blocked when this quota is filled.
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditingSettingsId(null)}
                className="text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={isSavingSettings}
                onClick={() => handleSaveSettings(editingSettingsId)}
                className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs"
              >
                {isSavingSettings ? "Saving..." : "Save Settings"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
