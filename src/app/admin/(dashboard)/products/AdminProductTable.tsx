"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Eye,
  EyeOff,
  Flag,
  Trash2,
  ExternalLink,
  Star,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";

interface ProductItem {
  id: string;
  title: string;
  slug: string;
  price: number;
  stock: number;
  status: string;
  condition: string;
  isFeatured: boolean;
  viewsCount: number;
  category: { name: string };
  vendor: {
    storeName: string;
    campus: { name: string };
  };
  images: { url: string }[];
}

export function AdminProductTable({ initialProducts }: { initialProducts: ProductItem[] }) {
  const [products, setProducts] = useState(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.vendor.storeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "ALL" || p.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, status: newStatus } : p))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleToggleFeatured = async (id: string, current: boolean) => {
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: !current }),
      });
      if (res.ok) {
        setProducts((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isFeatured: !current } : p))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this product?")) return;
    setLoadingId(id);
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setProducts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingId(null);
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "PUBLISHED":
        return <Badge className="bg-emerald-950 text-emerald-400 border border-emerald-800">Published</Badge>;
      case "HIDDEN":
        return <Badge className="bg-neutral-800 text-neutral-300 border border-neutral-700">Hidden</Badge>;
      case "FLAGGED":
        return <Badge className="bg-red-950 text-red-400 border border-red-800">Flagged</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by title, vendor, or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {["ALL", "PUBLISHED", "HIDDEN", "FLAGGED"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filterStatus === status
                  ? "bg-emerald-600 text-white"
                  : "bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-neutral-300">
            <thead className="bg-neutral-950/60 text-neutral-400 font-semibold border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Vendor & Campus</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Price</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Moderation Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500">
                    No products matching your search criteria.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const image = p.images[0]?.url || "/placeholder-product.jpg";
                  const isLoading = loadingId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-neutral-800/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-neutral-800 shrink-0">
                            <Image
                              src={image}
                              alt={p.title}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div>
                            <p className="font-bold text-white line-clamp-1">{p.title}</p>
                            <div className="flex items-center gap-2 text-[10px] text-neutral-400">
                              <span>{p.condition}</span>
                              {p.isFeatured && (
                                <span className="flex items-center gap-0.5 text-amber-400 font-semibold">
                                  <Star className="w-3 h-3 fill-current" /> Featured
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <p className="font-semibold text-white">{p.vendor.storeName}</p>
                        <p className="text-[10px] text-neutral-400">{p.vendor.campus.name}</p>
                      </td>

                      <td className="py-3 px-4 font-medium text-neutral-300">
                        {p.category.name}
                      </td>

                      <td className="py-3 px-4 font-bold text-white">
                        {formatPrice(p.price)}
                      </td>

                      <td className="py-3 px-4">
                        <span className={p.stock > 0 ? "text-emerald-400 font-semibold" : "text-red-400 font-semibold"}>
                          {p.stock} in stock
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        {statusBadge(p.status)}
                      </td>

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Live Link */}
                          <Link
                            href={`/product/${p.slug}`}
                            target="_blank"
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
                            title="View Live Listing"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>

                          {/* Toggle Featured */}
                          <button
                            onClick={() => handleToggleFeatured(p.id, p.isFeatured)}
                            disabled={isLoading}
                            className={`p-1.5 rounded-lg transition-colors ${
                              p.isFeatured
                                ? "bg-amber-950/60 text-amber-400 hover:bg-amber-900 border border-amber-800/60"
                                : "bg-neutral-800 text-neutral-400 hover:text-amber-400"
                            }`}
                            title={p.isFeatured ? "Unfeature" : "Feature on Homepage"}
                          >
                            <Star className="w-3.5 h-3.5" />
                          </button>

                          {/* Toggle Hide / Publish */}
                          {p.status === "PUBLISHED" ? (
                            <button
                              onClick={() => handleUpdateStatus(p.id, "HIDDEN")}
                              disabled={isLoading}
                              className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-amber-400 transition-colors"
                              title="Hide from Marketplace"
                            >
                              <EyeOff className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateStatus(p.id, "PUBLISHED")}
                              disabled={isLoading}
                              className="p-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800 text-emerald-400 transition-colors"
                              title="Publish / Unhide"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* Flag / Moderation */}
                          <button
                            onClick={() => handleUpdateStatus(p.id, p.status === "FLAGGED" ? "HIDDEN" : "FLAGGED")}
                            disabled={isLoading}
                            className={`p-1.5 rounded-lg transition-colors ${
                              p.status === "FLAGGED"
                                ? "bg-red-900 text-white"
                                : "bg-neutral-800 text-neutral-400 hover:text-red-400"
                            }`}
                            title={p.status === "FLAGGED" ? "Unflag" : "Flag Listing"}
                          >
                            <Flag className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={isLoading}
                            className="p-1.5 rounded-lg bg-neutral-800 hover:bg-red-950/80 hover:text-red-400 text-neutral-400 transition-colors"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
