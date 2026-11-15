import { z } from "zod";
import { CATEGORY_NAMES } from "./constants/categories";

export type ViewMode = "grid" | "list";

export type SortOption = "newest" | "price_asc" | "price_desc";

export type ListingStatus = "available" | "sold";

export interface Listing {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  seller_email: string;
  image_url: string | null;
  location: string;
  status: ListingStatus;
  sold_at: string | null;
  seller_onboarded: boolean;
  created_at: string;
  updated_at: string;
}

export interface SellerAccount {
  id: string;
  email: string;
  stripe_account_id: string;
  charges_enabled: boolean;
  payouts_enabled: boolean;
  details_submitted: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: string;
  listing_id: string;
  stripe_checkout_session_id: string;
  stripe_payment_intent_id: string | null;
  connected_account_id: string;
  seller_email: string;
  buyer_email: string | null;
  amount_cents: number;
  platform_fee_cents: number;
  seller_payout_cents: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  created_at: string;
  updated_at: string;
}

export interface ListingMessage {
  id: string;
  listing_id: string;
  buyer_email: string;
  seller_email: string;
  message: string;
  created_at: string;
}

export interface ApiError {
  error: string;
  details?: string | Record<string, string[] | undefined>;
}

export const createListingSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "Title must be at least 3 characters")
    .max(120, "Title must be 120 characters or fewer"),
  description: z
    .string()
    .trim()
    .min(10, "Description must be at least 10 characters")
    .max(3000, "Description must be 3000 characters or fewer"),
  price: z.coerce
    .number({ error: "Price must be a valid number" })
    .min(0, "Price cannot be negative")
    .max(1_000_000, "Price must be under $1,000,000"),
  category: z
    .string()
    .trim()
    .refine(
      (val) => CATEGORY_NAMES.includes(val),
      "Please select a valid marketplace category"
    ),
  seller_email: z
    .string()
    .trim()
    .email("Please enter a valid seller email address"),
  image_url: z
    .string()
    .trim()
    .url("Image URL must be a valid URL")
    .nullable()
    .optional(),
  location: z
    .string()
    .trim()
    .max(100, "Location must be 100 characters or fewer")
    .optional()
    .transform((val) => (val && val.length > 0 ? val : "Local pickup")),
});

export type CreateListingInput = z.infer<typeof createListingSchema>;

export const createMessageSchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
  buyer_email: z
    .string()
    .trim()
    .email("Please enter a valid email address"),
  message: z
    .string()
    .trim()
    .min(2, "Message must be at least 2 characters")
    .max(2000, "Message must be 2000 characters or fewer"),
});

export type CreateMessageInput = z.infer<typeof createMessageSchema>;

export const listingsQuerySchema = z.object({
  q: z.string().trim().optional(),
  category: z.string().trim().optional(),
  sort: z.enum(["newest", "price_asc", "price_desc"]).optional().default("newest"),
});

export type ListingsQuery = z.infer<typeof listingsQuerySchema>;

export const connectStripeSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Please enter a valid seller email address"),
});

export type ConnectStripeInput = z.infer<typeof connectStripeSchema>;

export const createCheckoutSchema = z.object({
  listing_id: z.string().uuid("Invalid listing ID"),
});

export type CreateCheckoutInput = z.infer<typeof createCheckoutSchema>;
