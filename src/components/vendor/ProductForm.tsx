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
  Timer,
  Clock,
  Sparkles,
  Flame,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { Loader } from "@/components/ui/Loader";
import { formatNGN } from "@/lib/utils";
import { calculatePromoPrice } from "@/lib/promotions-calc";

function toDateTimeLocalString(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, "0");
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

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

  // Existing promotion detection
  const existingPromo = React.useMemo(() => {
    if (!initialData?.promotions?.length) return null;
    return (
      initialData.promotions.find(
        (p: any) => p.status === "ACTIVE" || p.status === "SCHEDULED"
      ) || initialData.promotions[0]
    );
  }, [initialData?.promotions]);

  const [runPromo, setRunPromo] = React.useState<boolean>(
    Boolean(
      existingPromo &&
        (existingPromo.status === "ACTIVE" || existingPromo.status === "SCHEDULED")
    )
  );
  const [promoId, setPromoId] = React.useState<string | null>(
    existingPromo?.id || null
  );
  const [discountType, setDiscountType] = React.useState<"PERCENTAGE" | "FIXED">(
    existingPromo?.discountType === "FIXED" ? "FIXED" : "PERCENTAGE"
  );
  const [discountValue, setDiscountValue] = React.useState<string>(
    existingPromo?.discountValue?.toString() || "15"
  );

  const [startAt, setStartAt] = React.useState<string>(() => {
    if (existingPromo?.startAt) {
      return toDateTimeLocalString(new Date(existingPromo.startAt));
    }
    return toDateTimeLocalString(new Date());
  });

  const [endAt, setEndAt] = React.useState<string>(() => {
    if (existingPromo?.endAt) {
      return toDateTimeLocalString(new Date(existingPromo.endAt));
    }
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days
    return toDateTimeLocalString(future);
  });

  const [promoLabel, setPromoLabel] = React.useState<string>(
    existingPromo?.label || ""
  );

  // Live preview calculation
  const parsedPrice = parseFloat(price) || 0;
  const parsedDiscountVal = parseFloat(discountValue) || 0;
  const promoPreview = React.useMemo(() => {
    if (!parsedPrice || !parsedDiscountVal) {
      return { promoPrice: parsedPrice, discountPercent: 0, savingsAmount: 0 };
    }
    return calculatePromoPrice(parsedPrice, discountType, parsedDiscountVal);
  }, [parsedPrice, discountType, parsedDiscountVal]);

  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!title.trim()) {
      setError("Product title is required.");
      return;
    }
    if (!description.trim()) {
      setError("Product description is required.");
      return;
    }
    const currentPriceNum = parseFloat(price);
    if (!price || isNaN(currentPriceNum) || currentPriceNum <= 0) {
      setError("Please enter a valid price greater than ₦0.");
      return;
    }
    if (currentPriceNum > 100000000) {
      setError("Price cannot exceed ₦100,000,000.");
      return;
    }
    const parsedCompare = comparePrice ? parseFloat(comparePrice) : null;
    if (parsedCompare !== null && (isNaN(parsedCompare) || parsedCompare > 100000000)) {
      setError("Compare-at price cannot exceed ₦100,000,000.");
      return;
    }
    const parsedStock = parseInt(stock, 10);
    if (isNaN(parsedStock) || parsedStock < 0) {
      setError("Stock quantity cannot be negative.");
      return;
    }
    if (parsedStock > 99999) {
      setError("Stock quantity cannot exceed 99,999.");
      return;
    }
    if (!categoryId) {
      setError("Please select a product category.");
      return;
    }
    if (images.length === 0) {
      setError("Please upload at least one product photo.");
      return;
    }

    // Validate Promotion Settings
    let promoPayload: any = null;
    if (runPromo) {
      if (parsedDiscountVal <= 0) {
        setError("Promotion discount value must be greater than 0.");
        return;
      }
      if (promoPreview.promoPrice <= 0) {
        setError("Promotional price cannot be ₦0 or negative. Reduce the discount amount.");
        return;
      }
      if (promoPreview.promoPrice >= currentPriceNum) {
        setError("Promotional price must be strictly lower than regular price.");
        return;
      }
      const startDate = new Date(startAt);
      const endDate = new Date(endAt);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        setError("Please choose valid promotion start and end dates.");
        return;
      }
      if (endDate <= startDate) {
        setError("Promotion end date and time must be after start date and time.");
        return;
      }

      promoPayload = {
        id: promoId || undefined,
        enabled: true,
        discountType,
        discountValue: parsedDiscountVal,
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        label: promoLabel.trim() || null,
      };
    } else if (promoId) {
      // Vendor explicitly ended / turned off an existing promotion
      promoPayload = {
        id: promoId,
        enabled: false,
        discountType,
        discountValue: parsedDiscountVal || 1,
        startAt: new Date().toISOString(),
        endAt: new Date().toISOString(),
        label: null,
      };
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        price: currentPriceNum,
        comparePrice: parsedCompare,
        stock: parsedStock,
        categoryId,
        condition,
        status,
        tags: tags.trim() || null,
        model3dUrl: model3dUrl.trim() || null,
        videoUrl: videoUrl.trim() || null,
        images,
        promo: promoPayload,
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
    <form onSubmit={handleSubmit} className="space-y-8 relative">
      {loading && <Loader isModal={true} />}
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
              <label className="text-xs font-bold text-neutral-700">Product Title *</label>
              <Input
                required
                maxLength={120}
                placeholder="e.g. Vintage Oversized Graphic Hoodie or Casio Scientific Calculator"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-neutral-700">Detailed Description *</label>
              <textarea
                required
                rows={4}
                maxLength={3000}
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
                <label className="text-xs font-bold text-neutral-700">Price (₦) *</label>
                <Input
                  type="number"
                  required
                  min="1"
                  max="100000000"
                  step="1"
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
                  max="100000000"
                  step="1"
                  placeholder="5000 (Optional strike-through)"
                  value={comparePrice}
                  onChange={(e) => setComparePrice(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-neutral-700">Stock Quantity *</label>
                <Input
                  type="number"
                  required
                  min="0"
                  max="99999"
                  step="1"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Timed Promotion Box */}
          <div className="p-6 rounded-2xl bg-white border border-neutral-200/80 shadow-xs space-y-5 transition-all">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Timer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-neutral-900 flex items-center gap-2">
                    Run a Promo
                    {existingPromo && (
                      <Badge
                        className={`text-[9px] font-bold px-2 py-0.5 border ${
                          existingPromo.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : existingPromo.status === "SCHEDULED"
                            ? "bg-blue-50 text-blue-700 border-blue-200"
                            : "bg-neutral-100 text-neutral-600 border-neutral-200"
                        }`}
                      >
                        {existingPromo.status}
                      </Badge>
                    )}
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Schedule discount badges, strikethrough prices, and live countdowns
                  </p>
                </div>
              </div>

              {/* Enable / Disable Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={runPromo}
                  onChange={(e) => setRunPromo(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {runPromo && (
              <div className="space-y-4 pt-1 animate-in fade-in duration-200">
                {/* Discount Type & Value */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700">Discount Type</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setDiscountType("PERCENTAGE")}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          discountType === "PERCENTAGE"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                            : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        Percentage (%)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType("FIXED")}
                        className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                          discountType === "FIXED"
                            ? "bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-500/20"
                            : "bg-white border-neutral-200 text-neutral-600 hover:bg-neutral-50"
                        }`}
                      >
                        Fixed Amount (₦)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700">
                      {discountType === "PERCENTAGE" ? "Discount Percentage (%) *" : "Discount Amount (₦) *"}
                    </label>
                    <Input
                      type="number"
                      required={runPromo}
                      min="1"
                      max={discountType === "PERCENTAGE" ? "99" : parsedPrice ? String(parsedPrice - 1) : "99999999"}
                      step="1"
                      placeholder={discountType === "PERCENTAGE" ? "e.g. 20" : "e.g. 1000"}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                    />
                  </div>
                </div>

                {/* Timing Inputs (Start and End) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      Start Date & Time (WAT / Lagos) *
                    </label>
                    <Input
                      type="datetime-local"
                      required={runPromo}
                      value={startAt}
                      onChange={(e) => setStartAt(e.target.value)}
                      className="text-xs"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-neutral-700 flex items-center gap-1.5">
                      <Timer className="w-3.5 h-3.5 text-rose-600" />
                      End Date & Time (WAT / Lagos) *
                    </label>
                    <Input
                      type="datetime-local"
                      required={runPromo}
                      value={endAt}
                      onChange={(e) => setEndAt(e.target.value)}
                      className="text-xs"
                    />
                  </div>
                </div>

                {/* Optional Promo Label */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-neutral-700">
                    Promo Badge Label (Optional)
                  </label>
                  <Input
                    maxLength={50}
                    placeholder="e.g. Black Friday Deal, Campus Rush, 48H Flash Sale"
                    value={promoLabel}
                    onChange={(e) => setPromoLabel(e.target.value)}
                  />
                  <p className="text-[10px] text-neutral-400">
                    Visible to campus shoppers on product listing badges and detail page.
                  </p>
                </div>

                {/* Live Preview Card */}
                {parsedPrice > 0 && parsedDiscountVal > 0 && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-neutral-900 to-neutral-800 text-white space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-neutral-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Live Promo Preview
                      </span>
                      {promoLabel && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-500 text-[10px] font-black uppercase tracking-wider">
                          {promoLabel}
                        </span>
                      )}
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <div className="flex items-baseline gap-2.5">
                        <span className="text-2xl font-black text-emerald-400">
                          {formatNGN(promoPreview.promoPrice)}
                        </span>
                        <span className="text-xs text-neutral-400 line-through">
                          {formatNGN(parsedPrice)}
                        </span>
                      </div>
                      <span className="px-2 py-1 rounded-md bg-amber-400 text-neutral-950 font-black text-xs">
                        -{promoPreview.discountPercent}% OFF
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-neutral-300 border-t border-neutral-700/80 pt-2">
                      <span>Shopper savings: <strong className="text-white">{formatNGN(promoPreview.savingsAmount)}</strong></span>
                      <span className="text-amber-300 font-medium">
                        {new Date(startAt) > new Date() ? "Scheduled in advance" : "Active upon save"}
                      </span>
                    </div>

                    {promoPreview.promoPrice <= 0 && (
                      <div className="text-[11px] text-rose-300 font-bold bg-rose-950/60 p-2 rounded-lg border border-rose-800">
                        Warning: Promo price must be greater than ₦0.
                      </div>
                    )}
                    {promoPreview.promoPrice >= parsedPrice && (
                      <div className="text-[11px] text-rose-300 font-bold bg-rose-950/60 p-2 rounded-lg border border-rose-800">
                        Warning: Promo price must be lower than original price.
                      </div>
                    )}
                  </div>
                )}

                {/* End early option if editing active promo */}
                {isEditing && promoId && existingPromo?.status === "ACTIVE" && (
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100">
                    <span className="text-xs text-neutral-500">
                      Currently running live for campus shoppers.
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRunPromo(false)}
                      className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      End Promo Early
                    </Button>
                  </div>
                )}
              </div>
            )}
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
              disabled={
                loading ||
                !title.trim() ||
                !description.trim() ||
                !price ||
                parseFloat(price) <= 0 ||
                parseFloat(price) > 100000000 ||
                (comparePrice ? parseFloat(comparePrice) < 0 || parseFloat(comparePrice) > 100000000 : false) ||
                parseInt(stock, 10) < 0 ||
                parseInt(stock, 10) > 99999 ||
                images.length === 0
              }
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold h-11 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
            >
              {loading ? "Saving Product..." : isEditing ? "Update Product" : "Publish Product Now"}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
