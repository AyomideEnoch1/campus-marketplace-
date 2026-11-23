// Curated, contextual category photography for campus goods & services
// All images use Unsplash CDN parameters with fit=crop&crop=center for focal centralization

export const CATEGORY_IMAGES: Record<string, string> = {
  // Main Categories
  fashion:
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80&crop=center",
  electronics:
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80&crop=center",
  "hostel-essentials":
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=400&q=80&crop=center",
  "books-academics":
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80&crop=center",
  books:
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80&crop=center",
  academics:
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=400&q=80&crop=center",
  "beauty-care":
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80&crop=center",
  "food-groceries":
    "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=400&q=80&crop=center",
  "sports-fitness":
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80&crop=center",
  services:
    "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=400&q=80&crop=center",

  // Subcategories
  "mens-wear":
    "https://images.unsplash.com/photo-1617137984095-74e4e5e3613f?auto=format&fit=crop&w=400&q=80&crop=center",
  "womens-wear":
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=400&q=80&crop=center",
  "shoes-sneakers":
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=400&q=80&crop=center",
  "phones-tablets":
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&q=80&crop=center",
  phones:
    "https://images.unsplash.com/photo-1592750475338-74b7b21085ab?auto=format&fit=crop&w=400&q=80&crop=center",
  tablets:
    "https://images.unsplash.com/photo-1565849904461-04a58ad377e0?auto=format&fit=crop&w=400&q=80&crop=center",
  "laptops-computers":
    "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=400&q=80&crop=center",
  "audio-accessories":
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=400&q=80&crop=center",
  "kitchen-cooking":
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?auto=format&fit=crop&w=400&q=80&crop=center",
  "bedding-furniture":
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?auto=format&fit=crop&w=400&q=80&crop=center",
  "hostel-appliances":
    "https://images.unsplash.com/photo-1585338107529-13afc5f02586?auto=format&fit=crop&w=400&q=80&crop=center",
  "course-textbooks":
    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?auto=format&fit=crop&w=400&q=80&crop=center",
  "past-questions":
    "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?auto=format&fit=crop&w=400&q=80&crop=center",
  stationery:
    "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?auto=format&fit=crop&w=400&q=80&crop=center",
  fragrances:
    "https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?auto=format&fit=crop&w=400&q=80&crop=center",
  "hair-grooming":
    "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=400&q=80&crop=center",
  skincare:
    "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80&crop=center",
  "snacks-pastries":
    "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80&crop=center",
  provisions:
    "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80&crop=center",
  "club-jerseys":
    "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=400&q=80&crop=center",
  "fitness-gear":
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=400&q=80&crop=center",
  "tech-design":
    "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80&crop=center",
  "hair-barbing":
    "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=400&q=80&crop=center",
};

export const DEFAULT_CATEGORY_IMAGE =
  "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=400&q=80&crop=center";

export function getCategoryImage(slug?: string): string {
  if (!slug) return DEFAULT_CATEGORY_IMAGE;
  const s = slug.toLowerCase().trim();

  // Direct lookup
  if (CATEGORY_IMAGES[s]) return CATEGORY_IMAGES[s];

  // Keyword-based fallback for robust matching
  if (s.includes("book") || s.includes("academic") || s.includes("textbook") || s.includes("read")) {
    return CATEGORY_IMAGES["books-academics"];
  }
  if (s.includes("phone") || s.includes("tablet") || s.includes("iphone") || s.includes("android")) {
    return CATEGORY_IMAGES["phones-tablets"];
  }
  if (s.includes("laptop") || s.includes("computer") || s.includes("macbook")) {
    return CATEGORY_IMAGES["laptops-computers"];
  }
  if (s.includes("audio") || s.includes("headphone") || s.includes("earbud") || s.includes("speaker")) {
    return CATEGORY_IMAGES["audio-accessories"];
  }
  if (s.includes("fashion") || s.includes("cloth") || s.includes("wear") || s.includes("dress")) {
    return CATEGORY_IMAGES["fashion"];
  }
  if (s.includes("electron") || s.includes("gadget") || s.includes("tech")) {
    return CATEGORY_IMAGES["electronics"];
  }
  if (s.includes("hostel") || s.includes("living") || s.includes("bed") || s.includes("room")) {
    return CATEGORY_IMAGES["hostel-essentials"];
  }
  if (s.includes("beauty") || s.includes("fragrance") || s.includes("perfume") || s.includes("cosmetic")) {
    return CATEGORY_IMAGES["beauty-care"];
  }
  if (s.includes("food") || s.includes("snack") || s.includes("grocer") || s.includes("meal")) {
    return CATEGORY_IMAGES["food-groceries"];
  }
  if (s.includes("sport") || s.includes("fit") || s.includes("gym")) {
    return CATEGORY_IMAGES["sports-fitness"];
  }
  if (s.includes("service") || s.includes("barb") || s.includes("hair")) {
    return CATEGORY_IMAGES["services"];
  }

  return DEFAULT_CATEGORY_IMAGE;
}
