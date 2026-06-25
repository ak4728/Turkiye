export type CategoryId =
  | "restaurant"
  | "sight"
  | "poi"
  | "experience"
  | "hotel"
  | "shopping"
  | "other";

export interface Category {
  id: CategoryId;
  label: string;
  /** Emoji shown on the map marker and in the sidebar. */
  icon: string;
  /** Marker / accent color. */
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: "restaurant", label: "Restaurants", icon: "🍽️", color: "#ef4444" },
  { id: "sight", label: "Places to See", icon: "🏛️", color: "#3b82f6" },
  { id: "poi", label: "Points of Interest", icon: "📍", color: "#8b5cf6" },
  { id: "experience", label: "Experiences", icon: "🎭", color: "#f59e0b" },
  { id: "hotel", label: "Hotels & Stays", icon: "🏨", color: "#10b981" },
  { id: "shopping", label: "Shopping", icon: "🛍️", color: "#ec4899" },
  { id: "other", label: "Other", icon: "⭐", color: "#6b7280" },
];

export const CATEGORY_MAP: Record<CategoryId, Category> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, Category>,
);

export function getCategory(id: string): Category {
  return CATEGORY_MAP[id as CategoryId] ?? CATEGORY_MAP.other;
}
