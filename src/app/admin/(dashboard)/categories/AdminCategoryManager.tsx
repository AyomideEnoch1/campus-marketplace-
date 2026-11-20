"use client";

import { useState } from "react";
import {
  Plus,
  Layers,
  FolderPlus,
  Trash2,
  CheckCircle,
  EyeOff,
  ChevronRight,
  ChevronDown,
  Sparkles,
  Shirt,
  Smartphone,
  Laptop,
  BookOpen,
  Utensils,
  Dumbbell,
  GraduationCap,
  Home,
  Heart,
  Package,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  icon?: string | null;
  sortOrder: number;
  isActive: boolean;
  _count: { products: number };
  children: {
    id: string;
    name: string;
    slug: string;
    sortOrder: number;
    isActive: boolean;
    _count: { products: number };
  }[];
}

function renderCategoryIcon(iconName?: string | null) {
  if (!iconName) return <Layers className="w-4 h-4 text-emerald-400" />;
  const lower = iconName.toLowerCase().trim();
  if (lower.includes("sparkle") || lower.includes("beauty"))
    return <Sparkles className="w-4 h-4 text-emerald-400" />;
  if (lower.includes("shirt") || lower.includes("fashion") || lower.includes("apparel"))
    return <Shirt className="w-4 h-4 text-emerald-400" />;
  if (lower.includes("phone") || lower.includes("gadget") || lower.includes("electronics"))
    return <Smartphone className="w-4 h-4 text-emerald-400" />;
  if (lower.includes("laptop") || lower.includes("tech"))
    return <Laptop className="w-4 h-4 text-emerald-400" />;
  if (lower.includes("book") || lower.includes("academic"))
    return <BookOpen className="w-4 h-4 text-emerald-400" />;
  if (lower.includes("food") || lower.includes("utensil") || lower.includes("kitchen"))
    return <Utensils className="w-4 h-4 text-emerald-400" />;
  if (lower.includes("sport") || lower.includes("fit") || lower.includes("dumb"))
    return <Dumbbell className="w-4 h-4 text-emerald-400" />;
  if (lower.includes("campus") || lower.includes("school"))
    return <GraduationCap className="w-4 h-4 text-emerald-400" />;
  if (lower.includes("hostel") || lower.includes("home"))
    return <Home className="w-4 h-4 text-emerald-400" />;
  if (lower.includes("heart") || lower.includes("health"))
    return <Heart className="w-4 h-4 text-emerald-400" />;
  if (iconName.length <= 2) return <span className="text-sm">{iconName}</span>;
  return <Layers className="w-4 h-4 text-emerald-400" />;
}

export function AdminCategoryManager({
  initialCategories,
}: {
  initialCategories: CategoryNode[];
}) {
  const [categories, setCategories] = useState(initialCategories);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isCreating, setIsCreating] = useState(false);
  const [parentIdForNew, setParentIdForNew] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const toggleExpand = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slug || slug === name.toLowerCase().replace(/\s+/g, "-")) {
      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"));
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          slug,
          description,
          icon,
          parentId: parentIdForNew,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to create category");
      }

      // Refresh list
      const updatedRes = await fetch("/api/admin/categories");
      const updatedList = await updatedRes.json();
      setCategories(updatedList);

      setIsCreating(false);
      setName("");
      setSlug("");
      setDescription("");
      setIcon("");
      setParentIdForNew(null);
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        const updatedRes = await fetch("/api/admin/categories");
        const updatedList = await updatedRes.json();
        setCategories(updatedList);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/categories/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to delete");
        return;
      }
      const updatedRes = await fetch("/api/admin/categories");
      const updatedList = await updatedRes.json();
      setCategories(updatedList);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-neutral-400">
          Manage {categories.length} main categories and their nested subcategories.
        </p>
        <Button
          onClick={() => {
            setParentIdForNew(null);
            setIsCreating(true);
          }}
          className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 h-10 px-4 rounded-xl shadow-xs"
        >
          <Plus className="w-4 h-4" /> Add Root Category
        </Button>
      </div>

      {/* Creation Modal / Inline Drawer */}
      {isCreating && (
        <div className="bg-neutral-900 border border-emerald-500/40 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="font-bold text-sm text-white">
              {parentIdForNew ? "Add Subcategory" : "Add New Root Category"}
            </h3>
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
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campus Tech & Gadgets"
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  URL Slug
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. tech-gadgets"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Icon Identifier (Lucide / emoji)
                </label>
                <input
                  type="text"
                  placeholder="e.g. laptop, shirt, book, utensils"
                  value={icon}
                  onChange={(e) => setIcon(e.target.value)}
                  className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Laptops, chargers, power banks, calculators"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                {isSubmitting ? "Creating..." : "Save Category"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Categories Tree List */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden divide-y divide-neutral-800">
        {categories.map((cat) => {
          const isExp = expanded[cat.id];
          const hasChildren = cat.children && cat.children.length > 0;

          return (
            <div key={cat.id} className="transition-colors">
              {/* Parent Row */}
              <div className="p-3.5 sm:p-4 hover:bg-neutral-800/40 transition-colors">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left Column: Expand toggle, Icon, Name, Slug, Description */}
                  <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className="p-1.5 mt-0.5 rounded-lg hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors shrink-0"
                      aria-label={isExp ? "Collapse subcategories" : "Expand subcategories"}
                    >
                      {isExp ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </button>

                    <div className="w-9 h-9 rounded-xl bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                      {renderCategoryIcon(cat.icon)}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                        <span className="font-bold text-sm sm:text-base text-white leading-snug">
                          {cat.name}
                        </span>
                        <span className="text-[10px] sm:text-[11px] text-neutral-400 font-mono bg-neutral-800 px-1.5 py-0.5 rounded border border-neutral-700/60">
                          /{cat.slug}
                        </span>
                        {!cat.isActive && (
                          <Badge variant="outline" className="text-[10px] text-neutral-400 border-neutral-700">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      {cat.description && (
                        <p className="text-xs text-neutral-400 leading-relaxed line-clamp-2 sm:line-clamp-none">
                          {cat.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Column / Actions: Counts & Action Buttons */}
                  <div className="flex items-center justify-between md:justify-end gap-2.5 pl-9 md:pl-0 pt-1 md:pt-0 border-t border-neutral-800/50 md:border-t-0">
                    <span className="text-xs text-neutral-400 shrink-0">
                      <strong className="text-neutral-200">{cat._count.products}</strong> products ·{" "}
                      <strong className="text-neutral-200">{cat.children.length}</strong> subcategories
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Add Subcategory */}
                      <button
                        onClick={() => {
                          setParentIdForNew(cat.id);
                          setIsCreating(true);
                        }}
                        className="h-8 px-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium flex items-center gap-1.5 border border-neutral-700/70 transition-colors shadow-2xs"
                        title="Add nested subcategory"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="hidden xs:inline">Subcategory</span>
                      </button>

                      {/* Toggle Active */}
                      <button
                        onClick={() => handleToggleActive(cat.id, cat.isActive)}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-colors ${
                          cat.isActive
                            ? "bg-emerald-950/60 border-emerald-800/80 text-emerald-400 hover:bg-emerald-900/60"
                            : "bg-neutral-800 border-neutral-700 text-neutral-500 hover:text-neutral-300"
                        }`}
                        title={cat.isActive ? "Deactivate" : "Activate"}
                      >
                        {cat.isActive ? (
                          <CheckCircle className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(cat.id, cat.name)}
                        className="w-8 h-8 rounded-lg bg-neutral-800 hover:bg-red-950/80 border border-neutral-700 hover:border-red-800/80 text-neutral-400 hover:text-red-400 flex items-center justify-center transition-colors"
                        title="Delete Category"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Subcategories (if expanded) */}
              {isExp && hasChildren && (
                <div className="bg-neutral-950/80 pl-9 sm:pl-16 pr-3.5 sm:pr-6 py-2 divide-y divide-neutral-900 border-t border-neutral-800/60">
                  {cat.children.map((sub) => (
                    <div
                      key={sub.id}
                      className="py-2.5 flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                        <span className="font-semibold text-neutral-200 truncate">{sub.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono shrink-0">
                          /{sub.slug}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-[11px] text-neutral-400">
                          {sub._count.products} products
                        </span>
                        <button
                          onClick={() => handleDelete(sub.id, sub.name)}
                          className="p-1.5 rounded-md text-neutral-500 hover:text-red-400 hover:bg-neutral-800 transition-colors"
                          title="Delete subcategory"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
