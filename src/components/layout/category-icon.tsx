import {
  Armchair,
  BookOpen,
  Car,
  Dumbbell,
  Gamepad2,
  Home,
  Laptop,
  Shirt,
  Sparkles,
  Tag,
  type LucideIcon,
} from "lucide-react";
import type { CategoryItem } from "@/lib/constants/categories";

const ICON_MAP: Record<CategoryItem["iconName"], LucideIcon> = {
  Laptop,
  Car,
  Armchair,
  Shirt,
  Home,
  Gamepad2,
  Dumbbell,
  BookOpen,
  Sparkles,
  Tag,
};

interface CategoryIconProps {
  name: CategoryItem["iconName"];
  className?: string;
}

export function CategoryIcon({ name, className }: CategoryIconProps) {
  const Icon = ICON_MAP[name] ?? Tag;
  return <Icon className={className} aria-hidden="true" />;
}
