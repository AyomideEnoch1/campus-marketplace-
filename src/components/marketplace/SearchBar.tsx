"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, ArrowRight } from "lucide-react";

interface SearchBarProps {
  placeholder?: string;
  defaultValue?: string;
  className?: string;
  preserveCampus?: boolean;
  autoFocus?: boolean;
  size?: "sm" | "md" | "lg";
}

function SearchBarContent({
  placeholder = "What are you looking for?",
  defaultValue = "",
  className = "",
  preserveCampus = true,
  autoFocus = false,
  size = "md",
}: SearchBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const urlQ = searchParams?.get("q") || "";
  const [query, setQuery] = React.useState(defaultValue || urlQ);
  const [isFocused, setIsFocused] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Sync with URL q parameter if it changes
  React.useEffect(() => {
    setQuery(urlQ);
  }, [urlQ]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();

    const params = new URLSearchParams();
    if (trimmed) {
      params.set("q", trimmed);
    }

    // Preserve campus location filter if present and requested
    if (preserveCampus) {
      const currentCampus = searchParams?.get("campus");
      if (currentCampus) {
        params.set("campus", currentCampus);
      }
    }

    router.push(`/shop${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleClear = () => {
    setQuery("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
    // If currently displaying search results on shop page, navigate to clean search
    if (urlQ) {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.delete("q");
      router.push(`/shop${params.toString() ? `?${params.toString()}` : ""}`);
    }
  };

  const sizeStyles = {
    sm: "py-2 px-3 text-xs rounded-xl",
    md: "py-2.5 px-3.5 text-xs sm:text-sm rounded-2xl",
    lg: "py-3.5 px-4 text-sm sm:text-base rounded-2xl",
  }[size];

  const iconSizes = {
    sm: "w-3.5 h-3.5",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  }[size];

  return (
    <form
      onSubmit={handleSubmit}
      className={`relative flex items-center bg-white border border-neutral-200/90 shadow-2xs transition-all ${
        isFocused
          ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
          : "hover:border-neutral-300"
      } ${sizeStyles} ${className}`}
      role="search"
    >
      {/* Search Icon */}
      <button
        type="submit"
        aria-label="Submit search"
        className="text-neutral-400 hover:text-emerald-600 transition-colors shrink-0 mr-2 flex items-center justify-center"
      >
        <Search className={`${iconSizes} ${isFocused ? "text-emerald-600" : ""}`} />
      </button>

      {/* Input Field */}
      <input
        ref={inputRef}
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        spellCheck="false"
        className="w-full bg-transparent text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden text-inherit font-medium"
      />

      {/* Clear Button (Visible when there is text) */}
      {query && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search text"
          className="text-neutral-400 hover:text-neutral-700 p-1 rounded-full hover:bg-neutral-100 transition-colors shrink-0 ml-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Quick Search Arrow Submit */}
      {query.trim().length > 0 && (
        <button
          type="submit"
          className="ml-1 w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-xs"
          title="Search"
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      )}
    </form>
  );
}

export function SearchBar(props: SearchBarProps) {
  const sizeStyles = {
    sm: "py-2 px-3 text-xs rounded-xl",
    md: "py-2.5 px-3.5 text-xs sm:text-sm rounded-2xl",
    lg: "py-3.5 px-4 text-sm sm:text-base rounded-2xl",
  }[props.size || "md"];

  return (
    <React.Suspense
      fallback={
        <div
          className={`relative flex items-center bg-white border border-neutral-200/90 shadow-2xs ${sizeStyles} ${
            props.className || ""
          }`}
        >
          <Search className="w-4 h-4 text-neutral-400 mr-2 shrink-0" />
          <input
            type="text"
            readOnly
            placeholder={props.placeholder || "What are you looking for?"}
            className="w-full bg-transparent text-neutral-400 focus:outline-hidden text-inherit font-medium"
          />
        </div>
      }
    >
      <SearchBarContent {...props} />
    </React.Suspense>
  );
}
