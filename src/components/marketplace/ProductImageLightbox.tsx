"use client";

import * as React from "react";
import Image from "next/image";
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Sparkles,
} from "lucide-react";
import { formatNGN } from "@/lib/utils";

interface ProductImageLightboxProps {
  images: { url: string; altText?: string | null }[];
  initialIndex?: number;
  title: string;
  price?: number;
  condition?: string;
  onClose: () => void;
}

export function ProductImageLightbox({
  images,
  initialIndex = 0,
  title,
  price,
  condition,
  onClose,
}: ProductImageLightboxProps) {
  const [currentIndex, setCurrentIndex] = React.useState(initialIndex);
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = React.useState(false);
  const dragStartRef = React.useRef({ x: 0, y: 0 });
  const panStartRef = React.useRef({ x: 0, y: 0 });

  const activeImage = images[currentIndex]?.url || images[0]?.url;

  // Reset zoom & pan when image changes
  React.useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [currentIndex]);

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(3, +(prev + 0.5).toFixed(1)));
  };

  const handleZoomOut = () => {
    setZoom((prev) => {
      const next = Math.max(1, +(prev - 0.5).toFixed(1));
      if (next === 1) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Double-click to toggle zoom between 1x and 2x
  const handleDoubleClick = () => {
    if (zoom > 1) {
      handleResetZoom();
    } else {
      setZoom(2);
    }
  };

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Drag to pan when zoomed
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoom <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    panStartRef.current = { ...pan };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoom <= 1) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    // Limit panning bounds according to zoom level
    const maxPan = (zoom - 1) * 300;
    setPan({
      x: Math.max(-maxPan, Math.min(maxPan, panStartRef.current.x + dx)),
      y: Math.max(-maxPan, Math.min(maxPan, panStartRef.current.y + dy)),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Keyboard navigation & controls
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "+" || e.key === "=") {
        handleZoomIn();
      } else if (e.key === "-") {
        handleZoomOut();
      } else if (e.key === "0") {
        handleResetZoom();
      } else if (e.key === "ArrowLeft" && images.length > 1) {
        setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
      } else if (e.key === "ArrowRight" && images.length > 1) {
        setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [images.length, onClose]);

  // Lock body scroll when modal is open
  React.useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image Lightbox Viewer"
      className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-2xl flex flex-col justify-between p-3 sm:p-5 select-none animate-in fade-in duration-200"
      onClick={(e) => {
        // If clicking backdrop directly, close
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Top Protective Dark Scrim Gradient */}
      <div className="absolute top-0 inset-x-0 h-32 bg-gradient-to-b from-black/90 via-black/50 to-transparent pointer-events-none z-20" />

      {/* Bottom Protective Dark Scrim Gradient */}
      <div className="absolute bottom-0 inset-x-0 h-32 bg-gradient-to-t from-black/90 via-black/50 to-transparent pointer-events-none z-20" />

      {/* Top Header Bar */}
      <div className="relative flex items-center justify-between gap-3 z-30 pointer-events-auto">
        {/* Product Meta Pill: Solid dark glass with high contrast */}
        <div className="flex items-center gap-2.5 bg-neutral-950/90 backdrop-blur-xl rounded-2xl px-4 py-2.5 border border-white/20 shadow-2xl max-w-[50%] sm:max-w-md min-w-0">
          <p className="text-xs sm:text-sm font-extrabold text-white truncate drop-shadow-xs">
            {title}
          </p>
          {price !== undefined && (
            <span className="text-xs sm:text-sm font-black text-emerald-400 shrink-0">
              {formatNGN(price)}
            </span>
          )}
          {condition && (
            <span className="hidden sm:inline-block text-[10px] font-bold text-neutral-200 bg-neutral-800/90 border border-neutral-700/80 px-2 py-0.5 rounded-lg shrink-0">
              {condition}
            </span>
          )}
        </div>

        {/* Center: Interactive Zoom Controls Toolbar */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-neutral-950/90 backdrop-blur-xl rounded-2xl p-1 sm:p-1.5 border border-white/20 shadow-2xl">
          <button
            type="button"
            onClick={handleZoomOut}
            disabled={zoom <= 1}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Zoom Out (-)"
            aria-label="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <span className="text-[11px] font-black text-white px-2 min-w-[44px] text-center tracking-tight">
            {Math.round(zoom * 100)}%
          </span>

          <button
            type="button"
            onClick={handleZoomIn}
            disabled={zoom >= 3}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-white hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
            title="Zoom In (+)"
            aria-label="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>

          {zoom > 1 && (
            <button
              type="button"
              onClick={handleResetZoom}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-emerald-400 hover:bg-white/15 transition-colors cursor-pointer"
              title="Reset Zoom (0)"
              aria-label="Reset zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Close Icon Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-neutral-950/90 hover:bg-neutral-800 active:scale-95 text-white flex items-center justify-center transition-all shadow-2xl border border-white/20 shrink-0 cursor-pointer"
          title="Close Lightbox (Esc)"
          aria-label="Close lightbox"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Center Stage (Image Viewer) */}
      <div
        className="relative flex-1 flex items-center justify-center overflow-hidden my-2 cursor-default"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onDoubleClick={handleDoubleClick}
      >
        {/* Navigation Previous Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
            }}
            className="absolute left-2 sm:left-4 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral-950/80 hover:bg-neutral-900 active:scale-90 text-white flex items-center justify-center transition-all backdrop-blur-xl border border-white/20 shadow-2xl cursor-pointer"
            title="Previous image"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
        )}

        {/* Zoomed & Panned Image Frame */}
        <div
          className={`relative max-w-[85vw] max-h-[75vh] w-full h-full flex items-center justify-center ${
            zoom > 1
              ? isDragging
                ? "cursor-grabbing"
                : "cursor-grab"
              : "cursor-zoom-in"
          }`}
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transition: isDragging ? "none" : "transform 150ms ease-out",
          }}
        >
          <img
            src={activeImage}
            alt={title}
            draggable={false}
            className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl pointer-events-none select-none"
          />
        </div>

        {/* Navigation Next Button */}
        {images.length > 1 && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
            }}
            className="absolute right-2 sm:right-4 z-30 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-neutral-950/80 hover:bg-neutral-900 active:scale-90 text-white flex items-center justify-center transition-all backdrop-blur-xl border border-white/20 shadow-2xl cursor-pointer"
            title="Next image"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        )}
      </div>

      {/* Bottom Controls / Thumbnails */}
      <div className="relative flex flex-col items-center gap-2 z-30 pointer-events-auto">
        {images.length > 1 ? (
          <div className="flex items-center gap-2 bg-neutral-950/90 backdrop-blur-xl p-2 rounded-2xl border border-white/20 shadow-2xl overflow-x-auto max-w-full">
            {images.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                className={`relative w-12 h-12 rounded-xl overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                  currentIndex === idx
                    ? "border-emerald-400 ring-2 ring-emerald-400/50 scale-105"
                    : "border-transparent opacity-60 hover:opacity-100"
                }`}
              >
                <img
                  src={img.url}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        ) : (
          <div className="text-[11px] font-semibold text-neutral-300 bg-neutral-950/90 backdrop-blur-xl px-4 py-1.5 rounded-full border border-white/20 shadow-xl">
            Double-click or scroll to zoom &bull; Drag to pan &bull; Press Esc to close
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductImageLightbox;
