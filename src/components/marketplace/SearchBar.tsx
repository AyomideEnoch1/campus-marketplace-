"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Search, X, ArrowRight, Loader2, Sparkles, MapPin } from "lucide-react";
import { useDebounce } from "@/hooks/use-debounce";
import { useSearchProducts } from "@/hooks/use-products-query";
import { formatNGN } from "@/lib/utils";

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
  const currentCampus = preserveCampus ? searchParams?.get("campus") || undefined : undefined;

  const [query, setQuery] = React.useState(defaultValue || urlQ);
  const [isFocused, setIsFocused] = React.useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  // Debounce search input by 300ms to eliminate per-keystroke API spam
  const debouncedQuery = useDebounce(query, 300);

  // TanStack Query search hook:
  // - Caches previous query results
  // - Keyed by search term and campus
  // - Disables request if query is empty or < 2 characters
  // - Automatically cancels outdated requests via AbortSignal
  const {
    data: searchData,
    isLoading: isSearchLoading,
    isFetching: isSearchFetching,
  } = useSearchProducts(debouncedQuery, currentCampus, {
    enabled: isFocused && debouncedQuery.trim().length >= 2,
    limit: 5,
  });

  const searchResults = searchData?.products || [];

  // Sync with URL q parameter if it changes
  React.useEffect(() => {
    setQuery(urlQ);
  }, [urlQ]);

  // Handle clicking outside to close instant search suggestions
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    setIsDropdownOpen(false);

    const params = new URLSearchParams();
    if (trimmed) {
      params.set("q", trimmed);
    }

    if (preserveCampus && currentCampus) {
      params.set("campus", currentCampus);
    }

    router.push(`/shop${params.toString() ? `?${params.toString()}` : ""}`);
  };

  const handleClear = () => {
    setQuery("");
    setIsDropdownOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
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

  const showSuggestions =
    isDropdownOpen &&
    isFocused &&
    debouncedQuery.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative w-full">
      <form
        onSubmit={handleSubmit}
        className={`relative flex items-center bg-white border border-neutral-200/90 shadow-2xs transition-all ${
          isFocused
            ? "border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
            : "hover:border-neutral-300"
        } ${sizeStyles} ${className}`}
        role="search"
      >
        {/* Search Icon or Background Fetching Spinner */}
        <button
          type="submit"
          aria-label="Submit search"
          className="text-neutral-400 hover:text-emerald-600 transition-colors shrink-0 mr-2 flex items-center justify-center"
        >
          {isSearchFetching ? (
            <Loader2 className={`${iconSizes} animate-spin text-emerald-600`} />
          ) : (
            <Search className={`${iconSizes} ${isFocused ? "text-emerald-600" : ""}`} />
          )}
        </button>

        {/* Input Field */}
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsDropdownOpen(true);
          }}
          onFocus={() => {
            setIsFocused(true);
            setIsDropdownOpen(true);
          }}
          placeholder={placeholder}
          autoFocus={autoFocus}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          spellCheck="false"
          data-lpignore="true"
          data-form-type="other"
          className="w-full bg-transparent text-neutral-900 placeholder:text-neutral-400 focus:outline-hidden text-inherit font-medium"
        />

        {/* Clear Button */}
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
            aria-label="Submit search"
            className="ml-1 w-6 h-6 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shrink-0 active:scale-95 transition-all shadow-xs"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Instant Search Suggestions Dropdown (Powered by TanStack Query & Cached) */}
      {showSuggestions && (
        <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-xl border border-neutral-100 py-2 z-50 overflow-hidden animate-in fade-in-50 zoom-in-95">
          <div className="px-3.5 py-1.5 flex items-center justify-between text-[11px] font-bold text-neutral-400 uppercase tracking-wider border-b border-neutral-100">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              Suggested Products
            </span>
            {isSearchLoading ? (
              <span className="text-neutral-400 font-normal">Searching...</span>
            ) : (
              <span>{searchResults.length} match(es)</span>
            )}
          </div>

          {searchResults.length > 0 ? (
            <div className="divide-y divide-neutral-50 max-h-72 overflow-y-auto">
              {searchResults.map((prod) => (
                <Link
                  key={prod.id}
                  href={`/product/${prod.slug}`}
                  onClick={() => setIsDropdownOpen(false)}
                  className="flex items-center gap-3 px-3.5 py-2.5 hover:bg-neutral-50 transition-colors group"
                >
                  <div className="relative w-10 h-10 rounded-xl bg-neutral-100 overflow-hidden shrink-0">
                    <Image
                      src={
                        prod.images?.[0]?.url ||
                        "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80"
                      }
                      alt={prod.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-neutral-900 truncate group-hover:text-emerald-700">
                      {prod.title}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-neutral-500 mt-0.5">
                      <span className="font-extrabold text-emerald-600">
                        {formatNGN(prod.price)}
                      </span>
                      {prod.vendor?.campus?.name && (
                        <span className="flex items-center gap-0.5 truncate text-neutral-400">
                          <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                          {prod.vendor.campus.name}
                        </span>
                      )}
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-neutral-300 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all shrink-0" />
                </Link>
              ))}

              <div className="p-2 bg-neutral-50/50">
                <button
                  type="button"
                  onClick={handleSubmit}
                  className="w-full text-center py-2 text-xs font-bold text-emerald-700 hover:text-emerald-800 transition-colors"
                >
                  View all results for &quot;{debouncedQuery.trim()}&quot; &rarr;
                </button>
              </div>
            </div>
          ) : !isSearchLoading ? (
            <div className="p-6 text-center text-xs text-neutral-500">
              No products found matching &quot;{debouncedQuery.trim()}&quot;
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-neutral-400">
              Looking for campus products...
            </div>
          )}
        </div>
      )}
    </div>
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
