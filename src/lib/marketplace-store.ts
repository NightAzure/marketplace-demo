import type { Listing, SortOption, ViewMode } from "./types";

export interface ListingsSnapshot {
  listings: Listing[];
  total: number;
}

const VIEW_MODE_STORAGE_KEY = "marketplace:view-mode";
const SORT_STORAGE_KEY = "marketplace:sort";

const listingsCache = new Map<string, ListingsSnapshot>();
let lastSnapshot: ListingsSnapshot | null = null;
const preferenceListeners = new Set<() => void>();

function notifyPreferenceListeners(): void {
  for (const listener of preferenceListeners) {
    listener();
  }
}

/**
 * Subscribes a React component (via useSyncExternalStore) to viewMode and sort preference updates.
 */
export function subscribePreferences(listener: () => void): () => void {
  preferenceListeners.add(listener);

  if (typeof window === "undefined") {
    return () => {
      preferenceListeners.delete(listener);
    };
  }

  function handleStorage(event: StorageEvent) {
    if (
      event.key === VIEW_MODE_STORAGE_KEY ||
      event.key === SORT_STORAGE_KEY ||
      event.key === null
    ) {
      listener();
    }
  }

  window.addEventListener("storage", handleStorage);
  return () => {
    preferenceListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

/**
 * Server snapshot for viewMode during SSR and initial hydration.
 */
export function getServerViewMode(): ViewMode {
  return "grid";
}

/**
 * Server snapshot for sort during SSR and initial hydration.
 */
export function getServerSort(): SortOption {
  return "newest";
}

/**
 * Returns cached listings and total count for the given query key, if present.
 */
export function getCachedListings(key: string): ListingsSnapshot | undefined {
  return listingsCache.get(key);
}

/**
 * Stores listings and total count for a query key and updates the latest snapshot.
 */
export function setCachedListings(
  key: string,
  listings: Listing[],
  total: number
): void {
  const snapshot: ListingsSnapshot = { listings, total };
  listingsCache.set(key, snapshot);
  lastSnapshot = snapshot;
}

/**
 * Returns the most recently cached listings snapshot for stale-while-revalidate rendering.
 */
export function getLastListingsSnapshot(): ListingsSnapshot | null {
  return lastSnapshot;
}

/**
 * Clears all cached listing queries and the latest snapshot.
 */
export function invalidateListingsCache(): void {
  listingsCache.clear();
  lastSnapshot = null;
}

/**
 * Reads the persisted marketplace view mode preference ("grid" | "list").
 */
export function getStoredViewMode(): ViewMode {
  if (typeof window === "undefined") {
    return "grid";
  }

  try {
    const stored = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    if (stored === "grid" || stored === "list") {
      return stored;
    }
  } catch {
    // Ignore storage access errors in restricted contexts
  }

  return "grid";
}

/**
 * Persists the marketplace view mode preference to localStorage.
 */
export function setStoredViewMode(mode: ViewMode): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, mode);
  } catch {
    // Ignore storage access errors in restricted contexts
  }
  notifyPreferenceListeners();
}

/**
 * Reads the persisted marketplace sort preference ("newest" | "price_asc" | "price_desc").
 */
export function getStoredSort(): SortOption {
  if (typeof window === "undefined") {
    return "newest";
  }

  try {
    const stored = window.localStorage.getItem(SORT_STORAGE_KEY);
    if (
      stored === "newest" ||
      stored === "price_asc" ||
      stored === "price_desc"
    ) {
      return stored;
    }
  } catch {
    // Ignore storage access errors in restricted contexts
  }

  return "newest";
}

/**
 * Persists the marketplace sort preference to localStorage.
 */
export function setStoredSort(sort: SortOption): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(SORT_STORAGE_KEY, sort);
  } catch {
    // Ignore storage access errors in restricted contexts
  }
  notifyPreferenceListeners();
}
