import Stripe from "stripe";
import {
  MIN_STRIPE_PRICE_USD,
  PLATFORM_FEE_PERCENT,
} from "@/lib/stripe/constants";

export { MIN_STRIPE_PRICE_USD, PLATFORM_FEE_PERCENT };

let cachedStripeClient: Stripe | null = null;
let cachedStripeKey: string | null = null;

/**
 * Returns true when STRIPE_SECRET_KEY is configured in the environment.
 */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

/**
 * Returns a memoized server-side Stripe SDK client.
 * Throws a descriptive error if STRIPE_SECRET_KEY is missing.
 */
export function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY?.trim();
  if (!secretKey) {
    throw new Error(
      "Stripe is not configured. Add STRIPE_SECRET_KEY to your environment variables."
    );
  }

  if (!cachedStripeClient || cachedStripeKey !== secretKey) {
    cachedStripeClient = new Stripe(secretKey);
    cachedStripeKey = secretKey;
  }

  return cachedStripeClient;
}

/**
 * Calculates the marketplace platform fee in cents (10% default).
 */
export function calculatePlatformFeeCents(amountCents: number): number {
  if (!Number.isFinite(amountCents) || amountCents <= 0) {
    return 0;
  }
  return Math.round((amountCents * PLATFORM_FEE_PERCENT) / 100);
}

/**
 * Normalizes a seller email for consistent case-insensitive lookups.
 */
export function normalizeSellerEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Resolves the public application base URL from the incoming request or environment.
 */
export function getAppUrl(request?: Request): string {
  if (request) {
    const originHeader = request.headers.get("origin")?.trim();
    if (originHeader && /^https?:\/\//i.test(originHeader)) {
      return originHeader.replace(/\/+$/, "");
    }

    const forwardedHost = request.headers.get("x-forwarded-host")?.trim();
    const forwardedProto =
      request.headers.get("x-forwarded-proto")?.trim() || "https";
    if (forwardedHost) {
      return `${forwardedProto}://${forwardedHost}`.replace(/\/+$/, "");
    }

    try {
      const parsed = new URL(request.url);
      if (parsed.origin && parsed.origin !== "null") {
        return parsed.origin.replace(/\/+$/, "");
      }
    } catch {
      // Ignore invalid request URL and fall back to env
    }
  }

  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, "");
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/^https?:\/\//i, "").replace(/\/+$/, "")}`;
  }

  return "http://localhost:3000";
}
