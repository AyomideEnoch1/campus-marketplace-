"use client";

import * as React from "react";
import {
  UploadCloud,
  X,
  Loader2,
  Image as ImageIcon,
  Link as LinkIcon,
  AlertCircle,
  Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface SingleImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  aspectRatio?: "square" | "banner";
  folder?: "stores" | "products";
  label?: string;
  hint?: string;
}

export function SingleImageUpload({
  value,
  onChange,
  aspectRatio = "square",
  folder = "stores",
  label = "Upload Image",
  hint = "PNG, JPG, WEBP up to 10MB",
}: SingleImageUploadProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = React.useState(false);
  const [urlInput, setUrlInput] = React.useState("");

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const handleUpload = async (file: File) => {
    setError(null);
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("folder", folder);
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to upload image");
      }

      onChange(data.url || (data.urls && data.urls[0]));
    } catch (err: any) {
      console.warn("Upload endpoint issue, attempting base64 fallback...", err);

      try {
        const reader = new FileReader();
        reader.onload = () => {
          onChange(reader.result as string);
        };
        reader.readAsDataURL(file);
      } catch (fallbackErr: any) {
        setError(err.message || "Failed to upload photo");
      }
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(e.dataTransfer.files[0]);
    }
  };

  const isSquare = aspectRatio === "square";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-neutral-700">{label}</label>
        {hint && <span className="text-[11px] text-neutral-400">{hint}</span>}
      </div>

      {error && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {value ? (
        <div
          className={`relative rounded-2xl overflow-hidden border-2 border-neutral-200 bg-neutral-100 group shadow-2xs ${
            isSquare ? "w-28 h-28" : "w-full aspect-[3/1]"
          }`}
        >
          <img src={value} alt="Uploaded preview" className="w-full h-full object-cover" />

          {/* Action overlay */}
          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="px-2.5 py-1.5 rounded-lg bg-white/90 hover:bg-white text-neutral-900 text-xs font-bold flex items-center gap-1 shadow-sm"
            >
              <Camera className="w-3.5 h-3.5" />
              Change
            </button>
            <button
              type="button"
              onClick={() => onChange("")}
              className="p-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
              title="Remove photo"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2 ${
            isSquare ? "w-full sm:w-48 h-36" : "w-full h-32"
          } ${
            isDragging
              ? "border-emerald-600 bg-emerald-50/50"
              : "border-neutral-300 hover:border-emerald-500 bg-neutral-50/50 hover:bg-neutral-50"
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            onChange={(e) => e.target.files?.[0] && handleUpload(e.target.files[0])}
            className="hidden"
          />

          <div className="w-10 h-10 rounded-xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-center text-emerald-600">
            {uploading ? (
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
            ) : (
              <UploadCloud className="w-5 h-5" />
            )}
          </div>

          <div className="text-center">
            <p className="text-xs font-bold text-neutral-900">
              {uploading ? "Uploading..." : "Click or drag photo"}
            </p>
            <p className="text-[10px] text-neutral-400 mt-0.5">PNG, JPG or WEBP</p>
          </div>
        </div>
      )}

      {/* Alternative URL paste */}
      {!value && (
        <div className="pt-1">
          {!showUrlInput ? (
            <button
              type="button"
              onClick={() => setShowUrlInput(true)}
              className="text-[11px] text-neutral-500 hover:text-neutral-800 flex items-center gap-1 font-medium transition-colors"
            >
              <LinkIcon className="w-3 h-3 text-neutral-400" />
              <span>Paste image link instead</span>
            </button>
          ) : (
            <div className="flex gap-2 pt-1">
              <Input
                placeholder="https://..."
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                className="text-xs h-8 bg-white"
              />
              <Button
                type="button"
                size="sm"
                onClick={() => {
                  if (urlInput.trim()) {
                    onChange(urlInput.trim());
                    setUrlInput("");
                    setShowUrlInput(false);
                  }
                }}
                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white text-xs px-3 rounded-lg shrink-0"
              >
                Apply
              </Button>
              <button
                type="button"
                onClick={() => setShowUrlInput(false)}
                className="text-neutral-400 hover:text-neutral-600 px-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
