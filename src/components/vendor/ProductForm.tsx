"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  ImagePlus,
  Trash2,
  Box,
  Video,
  Layers,
  ArrowLeft,
  Check,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";

interface ProductFormProps {
  initialData?: any;
  categories: any[];
  isEditing?: boolean;
}

export function ProductForm({
  initialData,
  categories,
  isEditing = false,
}: ProductFormProps) {
  const router = useRouter();

  const [title, setTitle] = React.useState(initialData?.title || "");
  const [description, setDescription] = React.useState(initialData?.description || "");
  const [price, setPrice] = React.useState(initialData?.price?.toString() || "");
  const [comparePrice, setComparePrice] = React.useState(
    initialData?.comparePrice?.toString() || ""
  );
  const [stock, setStock] = React.useState(initialData?.stock?.toString() || "1");
  const [categoryId, setCategoryId] = React.useState(
    initialData?.categoryId || (categories[0]?.id || "")
  );
  const [condition, setCondition] = React.useState(initialData?.condition || "NEW");
  const [status, setStatus] = React.useState(initialData?.status || "PUBLISHED");
  const [tags, setTags] = React.useState(initialData?.tags || "");
  const [model3dUrl, setModel3dUrl] = React.useState(initialData?.model3dUrl || "");
  const [videoUrl, setVideoUrl] = React.useState(initialData?.videoUrl || "");

  // Images list
  const [images, setImages] = React.useState<string[]>(
    initialData?.images?.map((img: any) => img.url) || []
  );

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      if (images.length === 0) {
        throw new Error("Please add at least one product image");
      }

      const payload = {
        title,
        description,
        price: parseFloat(price),
        comparePrice: comparePrice ? parseFloat(comparePrice) : null,
        stock: parseInt(stock, 10),
        categoryId,
        condition,
        status,
        tags: tags || null,
        model3dUrl: model3dUrl || null,
        videoUrl: videoUrl || null,
        images,
      };

      const url = isEditing
        ? `/api/vendor/products/${initialData.id}`
        : "/api/vendor/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to save product");
      }

      setSuccess(true);
      setTimeout(() => {
        router.push("/dashboard/products");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>Product saved successfully! Redirecting...</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Core Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Details Box */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
              Item Information
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Product Title</label>
              <Input
                required
                placeholder="e.g. Vintage Oversized Graphic Hoodie or Casio Scientific Calculator"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Detailed Description</label>
              <textarea
                required
                rows={4}
                placeholder="Describe size, condition, material, features, and on-campus meetup/delivery availability..."
                className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/20"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
          </div>

          {/* Pricing & Stock Box */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
              Pricing (NGN) & Stock
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Price (₦)</label>
                <Input
                  type="number"
                  required
                  min="0"
                  step="50"
                  placeholder="3500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Compare-at Price (₦)</label>
                <Input
                  type="number"
                  min="0"
                  step="50"
                  placeholder="5000 (Optional strike-through)"
                  value={comparePrice}
                  onChange={(e) => setComparePrice(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Stock Quantity</label>
                <Input
                  type="number"
                  required
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Images Section */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
            <ImageUpload
              value={images}
              onChange={setImages}
              maxFiles={8}
              folder="products"
              title="Product Photos"
              description="Upload up to 8 photos from your device or phone. First photo serves as the main cover image."
            />
          </div>

          {/* Media: 3D Model & Video (Section 4.2) */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
              Interactive 3D Model & Short Video (Optional)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                  <Box className="w-3.5 h-3.5 text-emerald-600" />
                  Google 3D Model URL (.glb)
                </label>
                <Input
                  placeholder="https://example.com/model.glb"
                  value={model3dUrl}
                  onChange={(e) => setModel3dUrl(e.target.value)}
                  className="text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                  <Video className="w-3.5 h-3.5 text-emerald-600" />
                  Short Demo Video URL (.mp4)
                </label>
                <Input
                  placeholder="https://example.com/demo.mp4"
                  value={videoUrl}
                  onChange={(e) => setVideoUrl(e.target.value)}
                  className="text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Taxonomy & Publishing Status */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
              Category & Attributes
            </h3>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Category</label>
              <select
                aria-label="Select Category"
                className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-emerald-500"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Item Condition</label>
              <select
                aria-label="Select Item Condition"
                className="flex h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-xs text-neutral-900 outline-none focus:border-emerald-500"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="NEW">Brand New</option>
                <option value="USED_LIKE_NEW">Used - Like New</option>
                <option value="USED_GOOD">Used - Good Condition</option>
                <option value="USED_FAIR">Used - Fair Condition</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Tags (Comma-separated)</label>
              <Input
                placeholder="sneakers, thrift, textbooks, apple, hostel"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Publishing Controls */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-neutral-900 border-b border-neutral-100 pb-3">
              Publishing Status
            </h3>

            <div className="space-y-2">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="PUBLISHED"
                  checked={status === "PUBLISHED"}
                  onChange={() => setStatus("PUBLISHED")}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-xs font-bold text-neutral-900">Publish to Marketplace</p>
                  <p className="text-[11px] text-neutral-500">Visible to campus buyers</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-neutral-200 hover:bg-neutral-50 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value="DRAFT"
                  checked={status === "DRAFT"}
                  onChange={() => setStatus("DRAFT")}
                  className="text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="text-xs font-bold text-neutral-900">Save as Draft</p>
                  <p className="text-[11px] text-neutral-500">Only visible inside your dashboard</p>
                </div>
              </label>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11 rounded-xl shadow-md shadow-emerald-600/20"
            >
              {loading ? "Saving Product..." : isEditing ? "Update Product" : "Publish Product Now"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
