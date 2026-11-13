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
    "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=400&q=80&crop=center",
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
    "https://images.unsplash.com/photo-1511707171634-5f897ff02560?auto=format&fit=crop&w=400&q=80&crop=center",
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
    "https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=400&q=80&crop=center",
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
  return CATEGORY_IMAGES[slug] || DEFAULT_CATEGORY_IMAGE;
}
