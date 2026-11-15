"use client";

import * as React from "react";
import {
  AlertCircle,
  CheckCircle2,
  ImageIcon,
  Loader2,
  Mail,
  MessageCircle,
  Send,
} from "lucide-react";
import { formatPrice } from "@/lib/format";
import {
  createMessageSchema,
  type Listing,
} from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const QUICK_INQUIRY_STARTERS = [
  "Is this still available?",
  "Can I pick this up today?",
  "Is the price negotiable?",
] as const;

interface MessageSellerDialogProps {
  listing: Listing;
  onMessageSent?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  initialMessage?: string;
  triggerClassName?: string;
}

interface SendResult {
  emailSent: boolean;
  emailWarning?: string;
}

export function MessageSellerDialog({
  listing,
  onMessageSent,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
  initialMessage,
  triggerClassName,
}: MessageSellerDialogProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = React.useCallback(
    (next: boolean) => {
      if (!isControlled) {
        setInternalOpen(next);
      }
      controlledOnOpenChange?.(next);
    },
    [isControlled, controlledOnOpenChange]
  );

  const [buyerEmail, setBuyerEmail] = React.useState("");
  const [message, setMessage] = React.useState(initialMessage || "");
  const [fieldErrors, setFieldErrors] = React.useState<{
    buyer_email?: string;
    message?: string;
  }>({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [isSending, setIsSending] = React.useState(false);
  const [sendResult, setSendResult] = React.useState<SendResult | null>(null);

  const [prevOpen, setPrevOpen] = React.useState(open);
  const [prevInitialMessage, setPrevInitialMessage] =
    React.useState(initialMessage);

  if (open !== prevOpen || initialMessage !== prevInitialMessage) {
    setPrevOpen(open);
    setPrevInitialMessage(initialMessage);
    if (open && initialMessage) {
      setMessage(initialMessage);
      setSendResult(null);
      setServerError(null);
    }
  }

  function handleDialogOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setServerError(null);
      setFieldErrors({});
      setSendResult(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setServerError(null);

    const parsed = createMessageSchema.safeParse({
      listing_id: listing.id,
      buyer_email: buyerEmail,
      message,
    });

    if (!parsed.success) {
      const nextErrors: { buyer_email?: string; message?: string } = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (key === "buyer_email" && !nextErrors.buyer_email) {
          nextErrors.buyer_email = issue.message;
        }
        if (key === "message" && !nextErrors.message) {
          nextErrors.message = issue.message;
        }
      }
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    setIsSending(true);

    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed.data),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok || (!data?.ok && !data?.message)) {
        throw new Error(data?.error || "Failed to send message. Please try again.");
      }

      onMessageSent?.();
      setSendResult({
        emailSent: Boolean(data.emailSent),
        emailWarning: data.emailWarning,
      });
      setMessage("");
    } catch (error) {
      setServerError(
        error instanceof Error ? error.message : "Could not send message."
      );
    } finally {
      setIsSending(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleDialogOpenChange}>
      <DialogTrigger asChild>
        <Button
          type="button"
          className={cn(
            "h-11 w-full gap-2 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#2563EB] text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:from-[#1565D8] hover:to-[#1D4ED8] hover:shadow-md active:scale-[0.98]",
            triggerClassName
          )}
        >
          <MessageCircle className="size-4" />
          Message Seller
        </Button>
      </DialogTrigger>

      <DialogContent className="max-h-[calc(100dvh-1.5rem)] w-[calc(100vw-1.5rem)] max-w-lg grid-cols-[minmax(0,1fr)] overflow-x-hidden overflow-y-auto rounded-2xl border-[#E2E8F0] bg-white p-4 sm:p-6">
        <DialogHeader className="min-w-0 pr-7 text-left">
          <DialogTitle className="font-display break-words text-lg font-bold tracking-tight text-[#0F172A]">
            Message Seller
          </DialogTitle>
          <DialogDescription className="break-words text-xs leading-relaxed text-[#64748B]">
            Send a private message to the seller. They&apos;ll receive your inquiry and contact email directly in their inbox.
          </DialogDescription>
        </DialogHeader>

        {/* Listing Mini-Summary */}
        <div className="flex min-w-0 w-full items-center gap-3 overflow-hidden rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-3">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[#E2E8F0] bg-white">
            {listing.image_url ? (
              <img
                src={listing.image_url}
                alt={listing.title}
                className="size-full object-cover"
              />
            ) : (
              <ImageIcon className="size-5 text-[#64748B]" />
            )}
          </div>
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-sm font-semibold text-[#0F172A]">
              {listing.title}
            </p>
            <p
              className={cn(
                "text-sm font-bold tabular-nums",
                listing.price === 0 ? "text-emerald-600" : "text-[#1877F2]"
              )}
            >
              {formatPrice(listing.price)}
            </p>
          </div>
        </div>

        {sendResult ? (
          <div className="min-w-0 w-full space-y-4">
            <div className="min-w-0 space-y-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-sm text-emerald-900 sm:p-4">
              <div className="flex min-w-0 items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-600" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">Message sent!</p>
                  <p className="mt-0.5 break-words text-xs text-emerald-800">
                    Your inquiry was sent privately to the seller and won&apos;t appear publicly on this listing.
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-start gap-2 rounded-lg border border-emerald-200/80 bg-white/85 px-3 py-2 text-xs">
                <Mail className="mt-0.5 size-4 shrink-0 text-[#1877F2]" />
                <span className="min-w-0 flex-1 break-words text-[#0F172A]">
                  {sendResult.emailSent
                    ? "Email notification delivered to the seller — watch your inbox for their reply."
                    : sendResult.emailWarning ||
                      "Your inquiry was saved, though email delivery is not configured yet."}
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setSendResult(null)}
                className="w-full rounded-xl border-[#E2E8F0] sm:w-auto"
              >
                Send another message
              </Button>
              <Button
                type="button"
                onClick={() => handleDialogOpenChange(false)}
                className="w-full rounded-xl bg-gradient-to-r from-[#1877F2] to-[#2563EB] text-white transition-all duration-150 hover:from-[#1565D8] hover:to-[#1D4ED8] active:scale-[0.98] sm:w-auto"
              >
                Done
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="min-w-0 w-full space-y-4">
            {serverError && (
              <div
                role="alert"
                className="flex min-w-0 items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700"
              >
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <span className="min-w-0 flex-1 break-words">{serverError}</span>
              </div>
            )}

            {/* Quick Starter Chips */}
            <div className="min-w-0 space-y-1.5">
              <span className="text-xs font-medium text-[#64748B]">
                Quick messages
              </span>
              <div className="flex min-w-0 flex-wrap gap-1.5">
                {QUICK_INQUIRY_STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => {
                      setMessage(starter);
                      setFieldErrors((prev) => ({ ...prev, message: undefined }));
                    }}
                    className={cn(
                      "max-w-full whitespace-normal rounded-full border px-2.5 py-1 text-left text-xs font-medium leading-snug transition-all duration-150 active:scale-[0.98]",
                      message === starter
                        ? "border-[#1877F2] bg-[#EAF2FF] text-[#1877F2]"
                        : "border-[#E2E8F0] bg-[#F8FAFC] text-[#0F172A] hover:border-[#1877F2]/50 hover:bg-[#EAF2FF]/60"
                    )}
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="buyer-email" className="text-[#0F172A]">
                Your Email
              </Label>
              <Input
                id="buyer-email"
                type="email"
                value={buyerEmail}
                onChange={(e) => {
                  setBuyerEmail(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, buyer_email: undefined }));
                }}
                placeholder="buyer@example.com"
                className="w-full min-w-0 max-w-full"
                aria-invalid={Boolean(fieldErrors.buyer_email)}
              />
              {fieldErrors.buyer_email && (
                <p className="text-xs font-medium text-rose-600">
                  {fieldErrors.buyer_email}
                </p>
              )}
            </div>

            <div className="min-w-0 space-y-1.5">
              <Label htmlFor="buyer-message" className="text-[#0F172A]">
                Message
              </Label>
              <Textarea
                id="buyer-message"
                rows={4}
                maxLength={2000}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setFieldErrors((prev) => ({ ...prev, message: undefined }));
                }}
                placeholder="Hi, is this still available? I'd love to pick it up..."
                className="w-full min-w-0 max-w-full"
                aria-invalid={Boolean(fieldErrors.message)}
              />
              {fieldErrors.message && (
                <p className="text-xs font-medium text-rose-600">
                  {fieldErrors.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isSending}
              className="h-10 w-full min-w-0 max-w-full gap-2 rounded-xl bg-gradient-to-r from-[#1877F2] to-[#2563EB] font-semibold text-white shadow-sm transition-all duration-150 hover:from-[#1565D8] hover:to-[#1D4ED8] active:scale-[0.98]"
            >
              {isSending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Sending message...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Send Message
                </>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
