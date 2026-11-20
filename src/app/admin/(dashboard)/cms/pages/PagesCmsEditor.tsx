"use client";

import { useState } from "react";
import Link from "next/link";
import {
  FileText,
  Plus,
  Edit3,
  Trash2,
  ExternalLink,
  Check,
  ArrowLeftRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";

interface PageItem {
  id: string;
  title: string;
  slug: string;
  content: string;
  isPublished: boolean;
  metaTitle?: string | null;
  metaDescription?: string | null;
  updatedAt: string;
}

export function PagesCmsEditor({ initialPages }: { initialPages: PageItem[] }) {
  const [pages, setPages] = useState(initialPages);
  const [editingPage, setEditingPage] = useState<PageItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [isPublished, setIsPublished] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  const startCreate = () => {
    setEditingPage(null);
    setTitle("");
    setSlug("");
    setContent("");
    setIsPublished(true);
    setIsCreating(true);
  };

  const startEdit = (p: PageItem) => {
    setEditingPage(p);
    setTitle(p.title);
    setSlug(p.slug);
    setContent(p.content);
    setIsPublished(p.isPublished);
    setIsCreating(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingPage && !slug) {
      setSlug(val.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-"));
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg("");

    try {
      const url = editingPage
        ? `/api/admin/cms/pages/${editingPage.id}`
        : "/api/admin/cms/pages";
      const method = editingPage ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug, content, isPublished }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Save failed");

      const refreshed = await fetch("/api/admin/cms/pages");
      const list = await refreshed.json();
      setPages(list);

      setIsCreating(false);
      setEditingPage(null);
    } catch (err: any) {
      setMsg(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, pageTitle: string) => {
    if (!confirm(`Delete page "${pageTitle}"?`)) return;
    try {
      const res = await fetch(`/api/admin/cms/pages/${id}`, { method: "DELETE" });
      if (res.ok) {
        setPages((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-neutral-400">
          Create and edit static content pages (About, Terms, Privacy, FAQ).
        </p>
        <Button
          onClick={startCreate}
          className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs gap-1.5 self-start sm:self-auto shrink-0 shadow-sm"
        >
          <Plus className="w-4 h-4" /> Create Page
        </Button>
      </div>

      {/* Editor Modal / Panel */}
      {isCreating && (
        <div className="bg-neutral-900 border border-emerald-500/40 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
            <h3 className="font-bold text-sm text-white">
              {editingPage ? `Edit Page: ${editingPage.title}` : "Create New Static Page"}
            </h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-neutral-400 hover:text-white"
            >
              Cancel
            </button>
          </div>

          {msg && (
            <div className="p-3 bg-red-950/60 border border-red-800 rounded-xl text-xs text-red-300">
              {msg}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  Page Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Campus Safety & Anti-Scam Guidelines"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-neutral-300 block mb-1">
                  URL Route Path / Slug
                </label>
                <div className="flex items-center">
                  <span className="text-xs text-neutral-500 px-3 py-2.5 bg-neutral-950 border border-r-0 border-neutral-800 rounded-l-xl">
                    /
                  </span>
                  <input
                    type="text"
                    required
                    placeholder="safety-guidelines"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-r-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-neutral-300 block mb-1">
                Markdown / HTML Content Body
              </label>
              <textarea
                rows={10}
                required
                placeholder="Write your article, policy terms, or guidelines here in standard Markdown..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-neutral-950 border border-neutral-800 rounded-xl text-xs text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isPublished"
                checked={isPublished}
                onChange={(e) => setIsPublished(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 bg-neutral-950 border-neutral-700"
              />
              <label htmlFor="isPublished" className="text-xs font-semibold text-neutral-300">
                Publish publicly
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-neutral-800">
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
                disabled={saving}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs"
              >
                {saving ? "Saving..." : "Save Page"}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Mobile Scroll Hint */}
      <div className="flex sm:hidden items-center gap-1.5 px-1 text-[11px] text-neutral-400">
        <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>Swipe horizontally to view all page details &amp; actions</span>
      </div>

      {/* Pages List Container with Horizontal Scroll */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-neutral-900/50">
          <div className="min-w-[620px] divide-y divide-neutral-800">
            {pages.length === 0 ? (
              <div className="p-8 text-center text-xs text-neutral-500">
                No CMS pages found. Click &quot;Create Page&quot; to author your first page.
              </div>
            ) : (
              pages.map((p) => (
                <div
                  key={p.id}
                  className="p-4 sm:p-5 flex items-center justify-between hover:bg-neutral-800/40 transition-colors gap-6"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-neutral-800/80 border border-neutral-700/60 text-emerald-400 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <span className="font-bold text-sm text-white whitespace-nowrap">
                          {p.title}
                        </span>
                        <span className="text-[11px] font-mono text-neutral-400 bg-neutral-950/80 border border-neutral-800 px-2 py-0.5 rounded-md whitespace-nowrap">
                          /{p.slug}
                        </span>
                        {p.isPublished ? (
                          <Badge className="bg-emerald-950/80 text-emerald-400 border border-emerald-800 text-[10px] whitespace-nowrap">
                            Published
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] text-neutral-400 whitespace-nowrap">
                            Draft
                          </Badge>
                        )}
                      </div>
                      <p className="text-[11px] text-neutral-400 whitespace-nowrap">
                        Updated {formatDate(p.updatedAt)} · {p.content.length.toLocaleString()} characters
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Link
                      href={`/${p.slug}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 text-xs font-medium text-neutral-200 transition-colors"
                      title="View live page"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-neutral-400" />
                      <span>View</span>
                    </Link>
                    <button
                      onClick={() => startEdit(p)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-neutral-800/80 hover:bg-neutral-700 border border-neutral-700/60 text-xs font-medium text-neutral-200 transition-colors"
                      title="Edit page"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleDelete(p.id, p.title)}
                      className="p-2 rounded-xl bg-neutral-800/80 hover:bg-red-950/80 hover:text-red-400 border border-neutral-700/60 text-neutral-400 transition-colors"
                      title="Delete page"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
