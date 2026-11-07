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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CampusItem {
  id: string;
  name: string;
  slug: string;
  city: string;
  state?: string | null;
  isActive: boolean;
  _count: { vendors: number };
}

export function AdminCampusManager({
  initialCampuses,
}: {
  initialCampuses: CampusItem[];
}) {
  const [campuses, setCampuses] = useState(initialCampuses);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

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

      const refreshed = await fetch("/api/admin/campuses");
      const list = await refreshed.json();
      setCampuses(list);

      setIsCreating(false);
      setName("");
      setSlug("");
      setCity("");
      setState("");
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
        const refreshed = await fetch("/api/admin/campuses");
        const list = await refreshed.json();
        setCampuses(list);
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
      const refreshed = await fetch("/api/admin/campuses");
      const list = await refreshed.json();
      setCampuses(list);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400">
          Supported university campuses where buyers and vendors can trade.
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
        {campuses.map((campus) => (
          <div
            key={campus.id}
            className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 flex flex-col justify-between hover:border-neutral-700 transition-colors"
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
                </div>
              </div>

              <div className="mt-4">
                <h3 className="font-bold text-sm text-white line-clamp-1">
                  {campus.name}
                </h3>
                <p className="text-xs text-neutral-400 mt-0.5">
                  {campus.city}{campus.state ? `, ${campus.state}` : ""}
                </p>
                <p className="text-[11px] font-mono text-neutral-500 mt-1">
                  slug: /{campus.slug}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-neutral-800/60 flex items-center gap-2 text-xs text-neutral-400">
                <Users className="w-3.5 h-3.5 text-neutral-500" />
                <span>{campus._count.vendors} registered vendors</span>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-neutral-800 flex items-center justify-between text-xs">
              <Link
                href={`/campuses?campus=${campus.slug}`}
                target="_blank"
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
              >
                <span>View Campus</span>
                <ExternalLink className="w-3 h-3" />
              </Link>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handleToggleActive(campus.id, campus.isActive)}
                  className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300"
                  title={campus.isActive ? "Deactivate" : "Activate"}
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
          </div>
        ))}
      </div>
    </div>
  );
}
