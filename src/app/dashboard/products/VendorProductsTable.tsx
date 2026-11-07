"use client";

import * as React from "react";
import Link from "next/link";
import { Search, Edit3, Trash2, Eye, ExternalLink, PlusCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatNGN, formatDate } from "@/lib/utils";

interface VendorProductsTableProps {
  initialProducts: any[];
}

export function VendorProductsTable({
  initialProducts,
}: VendorProductsTableProps) {
  const [products, setProducts] = React.useState(initialProducts);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("ALL");
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const handleDelete = async (productId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    setDeletingId(productId);
    try {
      const res = await fetch(`/api/vendor/products/${productId}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Failed to delete product");
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (err: any) {
      alert(err.message || "Error deleting product");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category?.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "ALL" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-4">
      {/* Search and Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-3" />
          <Input
            placeholder="Search products by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 text-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto text-xs">
          {["ALL", "PUBLISHED", "DRAFT", "HIDDEN"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-colors ${
                statusFilter === st
                  ? "bg-neutral-900 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="rounded-2xl border border-neutral-200/80 bg-white overflow-hidden shadow-xs">
        {filteredProducts.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-neutral-700">No products found</p>
            <p className="text-xs text-neutral-500">Try adjusting your search or add a new product</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-neutral-50/70 border-b border-neutral-200/80 text-neutral-500 uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Item</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Stock</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Views</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/50 transition-colors">
                    {/* Item */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-neutral-100 border border-neutral-200 overflow-hidden shrink-0">
                          {p.images[0] ? (
                            <img
                              src={p.images[0].url}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">
                              📦
                            </div>
                          )}
                        </div>
                        <div className="truncate max-w-[220px]">
                          <p className="font-bold text-neutral-900 truncate">{p.title}</p>
                          <p className="text-[11px] text-neutral-400">
                            {formatDate(p.createdAt)}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-neutral-700 font-medium">
                      {p.category?.name}
                    </td>

                    {/* Price */}
                    <td className="py-3.5 px-4">
                      <span className="font-extrabold text-neutral-900">
                        {formatNGN(p.price)}
                      </span>
                      {p.comparePrice && (
                        <span className="block text-[10px] text-neutral-400 line-through">
                          {formatNGN(p.comparePrice)}
                        </span>
                      )}
                    </td>

                    {/* Stock */}
                    <td className="py-3.5 px-4 font-semibold text-neutral-700">
                      {p.stock > 0 ? (
                        <span>{p.stock} units</span>
                      ) : (
                        <span className="text-rose-600 font-bold">Out of stock</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <Badge
                        variant={p.status === "PUBLISHED" ? "default" : "secondary"}
                        className="text-[10px] uppercase font-bold"
                      >
                        {p.status}
                      </Badge>
                    </td>

                    {/* Views */}
                    <td className="py-3.5 px-4 text-neutral-500 font-medium">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-neutral-400" />
                        {p.viewsCount}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="p-1.5 rounded-lg border border-neutral-200 text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100"
                          title="View on shop"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                        <Link
                          href={`/dashboard/products/${p.id}/edit`}
                          className="p-1.5 rounded-lg border border-neutral-200 text-emerald-700 hover:bg-emerald-50"
                          title="Edit product"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </Link>
                        <button
                          disabled={deletingId === p.id}
                          onClick={() => handleDelete(p.id, p.title)}
                          className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50"
                          title="Delete listing"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
