"use client";

import * as React from "react";
import {
  UploadCloud,
  X,
  Star,
  ArrowLeft,
  ArrowRight,
  Image as ImageIcon,
  Loader2,
  Plus,
  AlertCircle,
  Link as LinkIcon,
  Check,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface ImageUploadProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  folder?: "products" | "stores";
  title?: string;
  description?: string;
}

export function ImageUpload({
  value = [],
  onChange,
  maxFiles = 8,
  folder = "products",
  title = "Product Images",
  description = "Upload high quality photos of your item (PNG, JPG, WEBP up to 10MB)",
}: ImageUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState("");

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Upload handler via FormData to /api/upload
  const handleFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    if (value.length + fileArray.length > maxFiles) {
      setUploadError(`You can only upload a maximum of ${maxFiles} photos.`);
      return;
    }

    setUploadError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("folder", folder);
      fileArray.forEach((file) => {
        formData.append("files", file);
      });

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to upload photos");
      }

      if (data.urls && Array.isArray(data.urls)) {
        onChange([...value, ...data.urls]);
      } else if (data.url) {
        onChange([...value, data.url]);
      }
    } catch (err: any) {
      console.warn("Upload endpoint issue, attempting base64 fallback...", err);

      // Client-side fallback to base64 Data URLs so vendor is never blocked
      try {
        const base64Promises = fileArray.map(
          (file) =>
            new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(file);
            })
        );
        const base64Results = await Promise.all(base64Promises);
        onChange([...value, ...base64Results]);
      } catch (fallbackErr: any) {
        setUploadError(err.message || "Failed to process photos");
      }
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (index: number) => {
    const updated = value.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSetCover = (index: number) => {
    if (index === 0) return;
    const item = value[index];
    const rest = value.filter((_, i) => i !== index);
    onChange([item, ...rest]);
  };

  const handleMove = (fromIndex: number, toIndex: number) => {
    if (toIndex < 0 || toIndex >= value.length) return;
    const copy = [...value];
    const [movedItem] = copy.splice(fromIndex, 1);
    copy.splice(toIndex, 0, movedItem);
    onChange(copy);
  };

  const handleAddUrl = () => {
    const trimmed = urlInput.trim();
    if (!trimmed) return;
    if (value.length >= maxFiles) {
      setUploadError(`Maximum limit of ${maxFiles} photos reached.`);
      return;
    }
    onChange([...value, trimmed]);
    setUrlInput("");
    setShowUrlInput(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
        <div>
          <h3 className="font-bold text-sm text-neutral-900">{title}</h3>
          <p className="text-xs text-neutral-500 mt-0.5">{description}</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-neutral-100 text-neutral-700">
          {value.length} / {maxFiles} photos
        </span>
      </div>

      {uploadError && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Upload Dropzone */}
      {value.length < maxFiles && (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? "border-emerald-600 bg-emerald-50/50 scale-[1.01]"
              : "border-neutral-300 hover:border-emerald-500 bg-neutral-50/50 hover:bg-neutral-50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />

          <div className="flex flex-col items-center justify-center gap-2.5">
            <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-center text-emerald-600">
              {uploading ? (
                <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
              ) : (
                <UploadCloud className="w-6 h-6" />
              )}
            </div>

            <div>
              <p className="text-sm font-bold text-neutral-900">
                {uploading
                  ? "Uploading photos to your catalog..."
                  : "Click to browse or drag & drop photos here"}
              </p>
              <p className="text-xs text-neutral-500 mt-0.5">
                Supports multiple JPEG, PNG, WEBP files up to 10MB each
              </p>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploading}
              className="mt-1 gap-1.5 rounded-xl border-neutral-300 text-xs font-semibold bg-white shadow-2xs hover:bg-neutral-100"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              Choose Photos From Device
            </Button>
          </div>
        </div>
      )}

      {/* Photos Grid */}
      {value.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-neutral-500 px-1">
            <span>Manage gallery (Cover photo is shown first in campus feeds)</span>
            <span>Drag or use arrows to rearrange</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {value.map((url, idx) => (
              <div
                key={idx}
                className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-neutral-200 bg-neutral-100 shadow-2xs transition-all hover:border-emerald-500"
              >
                <img
                  src={url}
                  alt={`Product photo ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Cover badge */}
                {idx === 0 ? (
                  <div className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-current" />
                    Cover Photo
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSetCover(idx);
                    }}
                    title="Set as cover photo"
                    className="absolute top-2 left-2 bg-black/60 hover:bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                  >
                    <Star className="w-3 h-3" />
                    Set Cover
                  </button>
                )}

                {/* Delete button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemove(idx);
                  }}
                  title="Remove photo"
                  className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Move buttons */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 backdrop-blur-xs rounded-lg px-2 py-1">
                  <button
                    type="button"
                    disabled={idx === 0}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(idx, idx - 1);
                    }}
                    className="text-white hover:text-emerald-400 disabled:opacity-30 p-0.5"
                    title="Move left"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[10px] font-bold text-white/90">
                    {idx + 1} of {value.length}
                  </span>
                  <button
                    type="button"
                    disabled={idx === value.length - 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMove(idx, idx + 1);
                    }}
                    className="text-white hover:text-emerald-400 disabled:opacity-30 p-0.5"
                    title="Move right"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Optional Web Link Accordion */}
      <div className="pt-2">
        {!showUrlInput ? (
          <button
            type="button"
            onClick={() => setShowUrlInput(true)}
            className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center gap-1.5 font-medium transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5 text-neutral-400" />
            <span>Or paste an image web URL link</span>
          </button>
        ) : (
          <div className="p-3 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-neutral-700">Paste Image Web URL</span>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="https://images.unsplash.com/photo-..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="text-xs bg-white"
              />
              <Button
                type="button"
                size="sm"
                onClick={handleAddUrl}
                className="bg-emerald-600 hover:bg-emerald-700 text-white shrink-0 text-xs rounded-xl"
              >
                Add URL
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
