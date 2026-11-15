"use client";

import * as React from "react";
import { AlertCircle, CreditCard, Loader2 } from "lucide-react";
import { formatPrice } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface BuyNowButtonProps {
  listingId: string;
  price: number;
  variant?: "card" | "detail";
  disabled?: boolean;
  className?: string;
}

export function BuyNowButton({
  listingId,
  price,
  variant = "detail",
  disabled = false,
  className,
}: BuyNowButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleBuyNow(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();

    if (disabled || isLoading) return;
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listing_id: listingId }),
      });

      const data = (await response.json().catch(() => ({}))) as {
        url?: string;
        error?: string;
      };

      if (!response.ok || !data.url) {
        throw new Error(
          data.error || "Unable to start Stripe Checkout. Please try again."
        );
      }

      window.location.href = data.url;
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong starting checkout."
      );
      setIsLoading(false);
    }
  }

  if (variant === "card") {
    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <Button
          type="button"
          size="sm"
          disabled={disabled || isLoading}
          onClick={handleBuyNow}
          className="relative z-10 h-8 w-full gap-1.5 rounded-xl bg-gradient-to-r from-[#059669] to-[#10B981] px-3 text-xs font-semibold text-white shadow-xs transition-all duration-150 hover:from-[#047857] hover:to-[#059669] active:scale-[0.98]"
        >
          {isLoading ? (
            <>
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              <span>Redirecting...</span>
            </>
          ) : (
            <>
              <CreditCard className="size-3.5" aria-hidden="true" />
              <span>Buy Now</span>
            </>
          )}
        </Button>
        {error && (
          <p className="text-[11px] font-medium text-rose-600 line-clamp-2">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Button
        type="button"
        disabled={disabled || isLoading}
        onClick={handleBuyNow}
        className={cn(
          "h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-[#059669] to-[#10B981] text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:from-[#047857] hover:to-[#059669] hover:shadow-md active:scale-[0.98]",
          className
        )}
      >
        {isLoading ? (
          <>
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            <span>Opening Stripe Checkout...</span>
          </>
        ) : (
          <>
            <CreditCard className="size-4" aria-hidden="true" />
            <span>Buy Now · {formatPrice(price)}</span>
          </>
        )}
      </Button>

      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
