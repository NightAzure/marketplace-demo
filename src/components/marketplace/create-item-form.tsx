"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AlertCircle,
  Clock,
  ImagePlus,
  Loader2,
  Mail,
  MapPin,
  RefreshCw,
  ShieldCheck,
  Tag,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { CATEGORIES, getCategoryByName, getCategoryBySlug } from "@/lib/constants/categories";
import { formatPrice, maskEmail } from "@/lib/format";
import { invalidateListingsCache } from "@/lib/marketplace-store";
import { createListingSchema, type Listing } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ItemCard } from "@/components/marketplace/item-card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type FieldErrors = Partial<
  Record<
    "title" | "price" | "category" | "location" | "seller_email" | "description" | "image_url",
    string
  >
>;

export function CreateItemForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const initialCategory = React.useMemo(() => {
    const param = searchParams.get("category");
    if (!param) return "";
    return getCategoryBySlug(param)?.name ?? getCategoryByName(param)?.name ?? "";
  }, [searchParams]);

  const [title, setTitle] = React.useState("");
  const [price, setPrice] = React.useState("");
  const [category, setCategory] = React.useState(initialCategory);
  const [location, setLocation] = React.useState("");
  const [sellerEmail, setSellerEmail] = React.useState("");
  const [description, setDescription] = React.useState("");

  const [imageUrl, setImageUrl] = React.useState<string | null>(null);
  const [uploadedFileName, setUploadedFileName] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadError, setUploadError] = React.useState<string | null>(null);
  const [isDragging, setIsDragging] = React.useState(false);

  const [fieldErrors, setFieldErrors] = React.useState<FieldErrors>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const [previewTab, setPreviewTab] = React.useState<"card" | "detail">("card");
  const [previewTimestamp] = React.useState(() => new Date().toISOString());

  function clearFieldError(field: keyof FieldErrors) {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  async function handleFileUpload(file: File) {
    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file (JPG, PNG, WebP, or GIF).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image must be 5 MB or smaller.");
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.url) {
        throw new Error(data?.error || "Failed to upload photo. Please try again.");
      }

      setImageUrl(data.url);
      setUploadedFileName(file.name);
      clearFieldError("image_url");
    } catch (error) {
      setUploadError(
        error instanceof Error
          ? error.message
          : "Could not upload image. Check your connection and try again."
      );
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  }

  function handleDragOver(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!isUploading) setIsDragging(true);
  }

  function handleDragLeave(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(event: React.DragEvent<HTMLDivElement>) {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    if (isUploading) return;

    const file = event.dataTransfer.files?.[0];
    if (file) {
      void handleFileUpload(file);
    }
  }

  function handleRemovePhoto() {
    setImageUrl(null);
    setUploadedFileName(null);
    setUploadError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    if (isUploading) {
      setServerError("Please wait for your photo upload to finish before publishing.");
      return;
    }

    const rawPayload = {
      title,
      price: price === "" ? NaN : Number(price),
      category,
      location: location.trim() || "Local pickup",
      seller_email: sellerEmail,
      description,
      image_url: imageUrl,
    };

    const parsed = createListingSchema.safeParse(rawPayload);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors | undefined;
        if (key && !nextErrors[key]) {
          nextErrors[key] = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.listing?.id) {
        throw new Error(data?.error || "Failed to publish listing. Please try again.");
      }

      const createdListing = data.listing as Listing;
      invalidateListingsCache();
      router.push(`/item/${createdListing.id}`);
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Something went wrong while publishing."
      );
      setIsSubmitting(false);
    }
  }

  const parsedPrice = Number.parseFloat(price);
  const numericPreviewPrice =
    Number.isFinite(parsedPrice) && parsedPrice >= 0 ? parsedPrice : 0;
  const previewPrice = formatPrice(numericPreviewPrice);
  const previewIsFree = numericPreviewPrice === 0;
  const previewTitle = title.trim() || "Item title";
  const previewLocation = location.trim() || "Local pickup";
  const previewCategory = category || "Category";
  const previewCategoryMeta = category ? getCategoryByName(category) : undefined;
  const previewDescription =
    description.trim() || "Your item description will appear here as you type...";
  const previewMaskedEmail = sellerEmail.includes("@")
    ? maskEmail(sellerEmail.trim())
    : "y***@example.com";
  const previewListing: Listing = {
    id: "preview",
    title: previewTitle,
    description: previewDescription,
    price: numericPreviewPrice,
    category: previewCategory,
    seller_email: sellerEmail.trim() || "you@example.com",
    image_url: imageUrl,
    location: previewLocation,
    status: "available",
    sold_at: null,
    seller_onboarded: false,
    created_at: previewTimestamp,
    updated_at: previewTimestamp,
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
      {/* Left: Listing Form */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="space-y-5 rounded-2xl border border-[#E2E8F0] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04),0_6px_20px_-6px_rgba(15,23,42,0.06)] sm:p-6 lg:col-span-6"
      >
        <div>
          <h2 className="font-display text-lg font-bold tracking-tight text-[#0F172A]">
            Listing details
          </h2>
          <p className="mt-0.5 text-xs text-[#64748B]">
            Add a clear photo, honest description, and your email for buyer replies.
          </p>
        </div>

        {serverError && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Photo Upload Zone */}
        <div className="space-y-2">
          <Label className="text-[#0F172A]">Photo</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="sr-only"
            aria-label="Upload listing photo"
          />

          {imageUrl ? (
            <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-[#F8FAFC]">
              <div className="relative flex h-52 w-full items-center justify-center bg-[#0B1120]">
                <img
                  src={imageUrl}
                  alt={uploadedFileName || "Uploaded listing preview"}
                  className="max-h-full max-w-full object-contain"
                />
                {isUploading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[#0B1120]/70 text-white backdrop-blur-xs">
                    <Loader2 className="mr-2 size-5 animate-spin" />
                    <span className="text-sm font-medium">Uploading photo...</span>
                  </div>
                )}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5">
                <span className="truncate text-xs font-medium text-[#0F172A]">
                  {uploadedFileName || "Photo uploaded"}
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="h-7 gap-1 border-[#E2E8F0] px-2.5 text-xs text-[#0F172A] hover:bg-[#F1F5F9]"
                  >
                    <RefreshCw className="size-3" />
                    Replace photo
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={isUploading}
                    onClick={handleRemovePhoto}
                    className="h-7 gap-1 px-2.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                  >
                    <Trash2 className="size-3" />
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !isUploading && fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === "Enter" || e.key === " ") && !isUploading) {
                  e.preventDefault();
                  fileInputRef.current?.click();
                }
              }}
              className={cn(
                "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-all duration-150",
                isDragging
                  ? "border-[#4338CA] bg-gradient-to-br from-[#1877F2]/10 to-[#4338CA]/10 ring-4 ring-[#1877F2]/15"
                  : "border-[#CBD5E1] bg-[#F8FAFC] hover:border-[#1877F2] hover:bg-[#EAF2FF]/45",
                isUploading && "pointer-events-none opacity-75"
              )}
            >
              {isUploading ? (
                <>
                  <Loader2 className="size-8 animate-spin text-[#1877F2]" />
                  <p className="mt-2.5 text-sm font-semibold text-[#0F172A]">
                    Uploading your photo...
                  </p>
                  <p className="mt-0.5 text-xs text-[#64748B]">
                    Please wait a moment
                  </p>
                </>
              ) : (
                <>
                  <div
                    className={cn(
                      "flex size-11 items-center justify-center rounded-full transition-colors",
                      isDragging
                        ? "bg-[#4338CA] text-white"
                        : "bg-[#EAF2FF] text-[#1877F2] group-hover:bg-[#1877F2] group-hover:text-white"
                    )}
                  >
                    <UploadCloud className="size-5" />
                  </div>
                  <p className="mt-2.5 text-sm font-semibold text-[#0F172A]">
                    Drag &amp; drop a photo here, or{" "}
                    <span className="text-[#1877F2] underline-offset-2 group-hover:underline">
                      browse files
                    </span>
                  </p>
                  <p className="mt-1 text-xs text-[#64748B]">
                    JPG, PNG, WebP, or GIF up to 5 MB
                  </p>
                </>
              )}
            </div>
          )}

          {uploadError && (
            <p className="flex items-center gap-1.5 text-xs font-medium text-rose-600">
              <AlertCircle className="size-3.5 shrink-0" />
              {uploadError}
            </p>
          )}
        </div>

        {/* Title */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="listing-title" className="text-[#0F172A]">
              Title
            </Label>
            <span className="text-xs tabular-nums text-[#64748B]">
              {title.length}/120
            </span>
          </div>
          <Input
            id="listing-title"
            value={title}
            maxLength={120}
            onChange={(e) => {
              setTitle(e.target.value);
              clearFieldError("title");
            }}
            placeholder="e.g., Apple MacBook Air M2 13-inch (256GB)"
            aria-invalid={Boolean(fieldErrors.title)}
          />
          {fieldErrors.title && (
            <p className="text-xs font-medium text-rose-600">{fieldErrors.title}</p>
          )}
        </div>

        {/* Price & Category */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="listing-price" className="text-[#0F172A]">
                Price
              </Label>
              {price !== "" && Number.isFinite(parsedPrice) && parsedPrice >= 0 && (
                <span
                  className={cn(
                    "text-xs font-semibold tabular-nums",
                    previewIsFree ? "text-emerald-600" : "text-[#1877F2]"
                  )}
                >
                  {previewPrice}
                </span>
              )}
            </div>
            <div className="relative">
              <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-medium text-[#64748B]">
                $
              </span>
              <Input
                id="listing-price"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => {
                  setPrice(e.target.value);
                  clearFieldError("price");
                }}
                placeholder="0.00"
                className="pl-7 tabular-nums"
                aria-invalid={Boolean(fieldErrors.price)}
              />
            </div>
            {fieldErrors.price && (
              <p className="text-xs font-medium text-rose-600">{fieldErrors.price}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="listing-category" className="text-[#0F172A]">
              Category
            </Label>
            <Select
              value={category}
              onValueChange={(value) => {
                setCategory(value);
                clearFieldError("category");
              }}
            >
              <SelectTrigger
                id="listing-category"
                className="w-full"
                aria-invalid={Boolean(fieldErrors.category)}
              >
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat.slug} value={cat.name}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldErrors.category && (
              <p className="text-xs font-medium text-rose-600">
                {fieldErrors.category}
              </p>
            )}
          </div>
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <Label htmlFor="listing-location" className="text-[#0F172A]">
            Location
          </Label>
          <Input
            id="listing-location"
            value={location}
            maxLength={100}
            onChange={(e) => {
              setLocation(e.target.value);
              clearFieldError("location");
            }}
            placeholder="City or neighborhood (optional)"
            aria-invalid={Boolean(fieldErrors.location)}
          />
          {fieldErrors.location && (
            <p className="text-xs font-medium text-rose-600">
              {fieldErrors.location}
            </p>
          )}
        </div>

        {/* Seller Email */}
        <div className="space-y-1.5">
          <Label htmlFor="listing-email" className="text-[#0F172A]">
            Seller Email
          </Label>
          <Input
            id="listing-email"
            type="email"
            value={sellerEmail}
            onChange={(e) => {
              setSellerEmail(e.target.value);
              clearFieldError("seller_email");
            }}
            placeholder="you@example.com"
            aria-invalid={Boolean(fieldErrors.seller_email)}
          />
          <p className="flex items-center gap-1.5 text-xs text-[#64748B]">
            <ShieldCheck className="size-3.5 shrink-0 text-[#1877F2]" />
            <span>
              Buyer inquiries are emailed directly here —{" "}
              <Link href="/connect" className="font-semibold text-[#1877F2] hover:underline">
                connect this email with Stripe
              </Link>{" "}
              to enable instant Buy Now.
            </span>
          </p>
          {fieldErrors.seller_email && (
            <p className="text-xs font-medium text-rose-600">
              {fieldErrors.seller_email}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="listing-description" className="text-[#0F172A]">
            Description
          </Label>
          <Textarea
            id="listing-description"
            rows={4}
            maxLength={3000}
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              clearFieldError("description");
            }}
            placeholder="Describe condition, dimensions, included accessories, and pickup details..."
            aria-invalid={Boolean(fieldErrors.description)}
          />
          {fieldErrors.description && (
            <p className="text-xs font-medium text-rose-600">
              {fieldErrors.description}
            </p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isSubmitting || isUploading}
          className="h-11 w-full rounded-xl bg-gradient-to-r from-[#1877F2] to-[#4338CA] text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:from-[#1565D8] hover:to-[#3730A3] hover:shadow-md active:scale-[0.98]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" />
              Publishing listing...
            </>
          ) : (
            "Publish Listing"
          )}
        </Button>
      </form>

      {/* Right: Real-time Synchronized Marketplace Preview */}
      <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-[0_1px_3px_rgba(15,23,42,0.04),0_6px_20px_-6px_rgba(15,23,42,0.06)] lg:sticky lg:top-20 lg:col-span-6">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E2E8F0] px-4 py-3 sm:px-5">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="font-display text-sm font-semibold text-[#0F172A]">
              Live Preview
            </span>
          </div>

          <div
            role="tablist"
            aria-label="Listing preview mode"
            className="inline-flex rounded-xl bg-[#F1F5F9] p-1"
          >
            <button
              type="button"
              role="tab"
              aria-selected={previewTab === "card"}
              onClick={() => setPreviewTab("card")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-all duration-150",
                previewTab === "card"
                  ? "bg-white text-[#1877F2] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              Listing Card Preview
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={previewTab === "detail"}
              onClick={() => setPreviewTab("detail")}
              className={cn(
                "rounded-lg px-3 py-1 text-xs font-semibold transition-all duration-150",
                previewTab === "detail"
                  ? "bg-white text-[#1877F2] shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              )}
            >
              Detail Page Preview
            </button>
          </div>
        </div>

        <div className="bg-[#F4F6FB] p-5 sm:p-6">
          {previewTab === "card" ? (
            <div className="mx-auto max-w-[270px]">
              <ItemCard listing={previewListing} viewMode="grid" previewMode />
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white shadow-xs">
              <div className="flex aspect-[16/10] w-full items-center justify-center bg-[#0B1120]">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={previewTitle}
                    className="max-h-full max-w-full object-contain"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <ImagePlus className="size-9 opacity-60" />
                    <span className="text-xs">Photo preview</span>
                  </div>
                )}
              </div>

              <div className="space-y-4 p-4 sm:p-5">
                <div>
                  <h3 className="font-display text-xl font-bold tracking-tight text-[#0F172A]">
                    {previewTitle}
                  </h3>
                  <p
                    className={cn(
                      "mt-1 font-display text-xl font-extrabold tabular-nums",
                      previewIsFree ? "text-emerald-600" : "text-[#0F172A]"
                    )}
                  >
                    {previewPrice}
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-xs text-[#64748B]">
                    <Badge
                      variant="outline"
                      className={cn(
                        "border font-medium",
                        previewCategoryMeta?.pillClass ??
                          "border-[#E2E8F0] bg-[#EAF2FF] text-[#1877F2]"
                      )}
                    >
                      <Tag className="mr-1 size-3" />
                      {previewCategory}
                    </Badge>
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="size-3.5" />
                      {previewLocation}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" />
                      Just now
                    </span>
                  </div>
                </div>

                <div className="border-t border-[#E2E8F0] pt-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[#64748B]">
                    Description
                  </p>
                  <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-[#0F172A]">
                    {previewDescription}
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] px-3 py-2.5 text-xs">
                  <div className="flex items-center gap-2 text-[#0F172A]">
                    <Mail className="size-4 text-[#1877F2]" />
                    <span>Seller: {previewMaskedEmail}</span>
                  </div>
                  <span className="font-medium text-emerald-700">
                    Email alerts active
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
