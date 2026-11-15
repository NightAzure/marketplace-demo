"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, Home, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Marketplace route error:", error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full rounded-2xl border border-[#DADDE1] bg-white p-8 shadow-xs">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#E41E3F]/10 text-[#E41E3F]">
          <AlertTriangle className="size-7" aria-hidden="true" />
        </div>
        <h1 className="mt-4 text-xl font-bold text-[#1C1E21]">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-[#65676B]">
          We ran into an unexpected error while loading this Marketplace page.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            type="button"
            onClick={reset}
            className="gap-1.5 bg-[#1877F2] text-white hover:bg-[#166FE5]"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            <span>Try again</span>
          </Button>
          <Button
            asChild
            variant="outline"
            className="gap-1.5 border-[#DADDE1] bg-white text-[#1C1E21] hover:bg-[#F0F2F5]"
          >
            <Link href="/">
              <Home className="size-4" aria-hidden="true" />
              <span>Back to Marketplace</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
