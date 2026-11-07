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
      <div className="flex items-center justify-between">
        <p className="text-xs text-neutral-400">
          Manage {categories.length} main categories and their nested subcategories.
        </p>
        <Button
          onClick={() => {
            setParentIdForNew(null);
            setIsCreating(true);
          }}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5"
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
              <div className="p-4 flex items-center justify-between hover:bg-neutral-800/40">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleExpand(cat.id)}
                    className="p-1 rounded hover:bg-neutral-800 text-neutral-400"
                  >
                    {isExp ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>

                  <div className="w-8 h-8 rounded-lg bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 flex items-center justify-center font-bold text-xs">
                    {cat.icon || "📂"}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">{cat.name}</span>
                      <span className="text-[11px] text-neutral-500 font-mono">
                        /{cat.slug}
                      </span>
                      {!cat.isActive && (
                        <Badge variant="outline" className="text-[10px] text-neutral-400">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    {cat.description && (
                      <p className="text-xs text-neutral-400">{cat.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-neutral-400 mr-2">
                    {cat._count.products} products · {cat.children.length} subcategories
                  </span>

                  {/* Add Subcategory */}
                  <button
                    onClick={() => {
                      setParentIdForNew(cat.id);
                      setIsCreating(true);
                    }}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-xs flex items-center gap-1 px-2.5 transition-colors"
                  >
                    <FolderPlus className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Subcategory</span>
                  </button>

                  {/* Toggle Active */}
                  <button
                    onClick={() => handleToggleActive(cat.id, cat.isActive)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-400 hover:text-white transition-colors"
                    title={cat.isActive ? "Deactivate" : "Activate"}
                  >
                    {cat.isActive ? (
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-neutral-500" />
                    )}
                  </button>

                  {/* Delete (if empty) */}
                  <button
                    onClick={() => handleDelete(cat.id, cat.name)}
                    className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950/80 hover:text-red-400 text-neutral-500 transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Subcategories (if expanded) */}
              {isExp && hasChildren && (
                <div className="bg-neutral-950/70 pl-14 pr-4 py-2 divide-y divide-neutral-900 border-t border-neutral-800/40">
                  {cat.children.map((sub) => (
                    <div
                      key={sub.id}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-neutral-200">{sub.name}</span>
                        <span className="text-[10px] text-neutral-500 font-mono">
                          /{sub.slug}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-neutral-400">
                          {sub._count.products} products
                        </span>
                        <button
                          onClick={() => handleDelete(sub.id, sub.name)}
                          className="p-1 rounded text-neutral-500 hover:text-red-400"
                          title="Delete subcategory"
                        >
                          <Trash2 className="w-3 h-3" />
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
