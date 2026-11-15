/**
 * Formats a numeric USD price cleanly:
 * - `0` -> `"Free"`
 * - Whole dollars -> `"$120"`
 * - Dollars with cents -> `"$120.50"`
 */
export function formatPrice(price: number): string {
  if (!Number.isFinite(price) || price < 0) {
    return "$0";
  }

  if (price === 0) {
    return "Free";
  }

  const hasCents = Math.round(price * 100) % 100 !== 0;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: hasCents ? 2 : 0,
    maximumFractionDigits: hasCents ? 2 : 0,
  }).format(price);
}

/**
 * Formats an ISO timestamp into a compact relative time string
 * (e.g., `"Just now"`, `"5m ago"`, `"2h ago"`, `"3d ago"`, or a short date).
 */
export function formatRelativeTime(isoDate: string): string {
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const now = new Date();
  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSeconds < 60) {
    return "Just now";
  }

  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `${diffDays}d ago`;
  }

  const includeYear = date.getFullYear() !== now.getFullYear();
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    ...(includeYear ? { year: "numeric" } : {}),
  }).format(date);
}

/**
 * Masks an email address for public UI display (e.g., `"j***@gmail.com"`).
 */
export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const atIndex = trimmed.indexOf("@");
  if (atIndex <= 0 || atIndex === trimmed.length - 1) {
    return "***";
  }

  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex + 1);

  if (localPart.length <= 1) {
    return `*@${domainPart}`;
  }

  return `${localPart[0]}***@${domainPart}`;
}
