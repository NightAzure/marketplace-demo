export interface CategoryItem {
  slug: string;
  name: string;
  iconName:
    | "Laptop"
    | "Car"
    | "Armchair"
    | "Shirt"
    | "Home"
    | "Gamepad2"
    | "Dumbbell"
    | "BookOpen"
    | "Sparkles"
    | "Tag";
  description: string;
  badgeBg: string;
  badgeText: string;
  pillClass: string;
}

const UNIFIED_CATEGORY_THEME = {
  badgeBg: "bg-[#EAF2FF]",
  badgeText: "text-[#1466D8]",
  pillClass: "bg-[#EAF2FF] text-[#1466D8] border-[#1877F2]/20",
} as const;

export const CATEGORIES: readonly CategoryItem[] = [
  {
    slug: "electronics",
    name: "Electronics",
    iconName: "Laptop",
    description: "Phones, laptops, audio gear, cameras, and accessories",
    ...UNIFIED_CATEGORY_THEME,
  },
  {
    slug: "vehicles",
    name: "Vehicles",
    iconName: "Car",
    description: "Cars, motorcycles, bikes, and auto parts",
    ...UNIFIED_CATEGORY_THEME,
  },
  {
    slug: "furniture",
    name: "Furniture",
    iconName: "Armchair",
    description: "Sofas, desks, tables, chairs, and storage",
    ...UNIFIED_CATEGORY_THEME,
  },
  {
    slug: "clothing",
    name: "Clothing",
    iconName: "Shirt",
    description: "Apparel, shoes, jackets, and everyday wear",
    ...UNIFIED_CATEGORY_THEME,
  },
  {
    slug: "home-and-garden",
    name: "Home & Garden",
    iconName: "Home",
    description: "Appliances, decor, tools, and outdoor patio gear",
    ...UNIFIED_CATEGORY_THEME,
  },
  {
    slug: "toys-and-games",
    name: "Toys & Games",
    iconName: "Gamepad2",
    description: "Board games, consoles, puzzles, and kids toys",
    ...UNIFIED_CATEGORY_THEME,
  },
  {
    slug: "sports-and-outdoors",
    name: "Sports & Outdoors",
    iconName: "Dumbbell",
    description: "Fitness equipment, camping gear, and sporting goods",
    ...UNIFIED_CATEGORY_THEME,
  },
  {
    slug: "books-and-media",
    name: "Books & Media",
    iconName: "BookOpen",
    description: "Books, vinyl records, movies, and musical instruments",
    ...UNIFIED_CATEGORY_THEME,
  },
  {
    slug: "collectibles",
    name: "Collectibles",
    iconName: "Sparkles",
    description: "Vintage items, trading cards, art, and memorabilia",
    ...UNIFIED_CATEGORY_THEME,
  },
  {
    slug: "other",
    name: "Other",
    iconName: "Tag",
    description: "Miscellaneous local finds and everyday items",
    ...UNIFIED_CATEGORY_THEME,
  },
] as const;

export const CATEGORY_NAMES = CATEGORIES.map((category) => category.name);

export function getCategoryBySlug(slug: string): CategoryItem | undefined {
  const normalized = slug.trim().toLowerCase();
  return CATEGORIES.find((category) => category.slug === normalized);
}

export function getCategoryByName(name: string): CategoryItem | undefined {
  const normalized = name.trim().toLowerCase();
  return CATEGORIES.find(
    (category) => category.name.toLowerCase() === normalized
  );
}
