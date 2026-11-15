import Link from "next/link";
import { Home, Plus, Store } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-lg flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full rounded-2xl border border-[#DADDE1] bg-white p-8 shadow-xs">
        <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-[#E7F3FF] text-[#1877F2]">
          <Store className="size-7" aria-hidden="true" />
        </div>
        <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-[#1877F2]">
          404 · Page Not Found
        </p>
        <h1 className="mt-1 text-2xl font-bold text-[#1C1E21]">
          This listing or page isn&apos;t available
        </h1>
        <p className="mt-2 text-sm text-[#65676B]">
          The item may have been removed or the link might be incorrect. Browse
          current local listings or post your own.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            asChild
            className="gap-1.5 bg-[#1877F2] text-white hover:bg-[#166FE5]"
          >
            <Link href="/">
              <Home className="size-4" aria-hidden="true" />
              <span>Browse Marketplace</span>
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="gap-1.5 border-[#DADDE1] bg-white text-[#1C1E21] hover:bg-[#F0F2F5]"
          >
            <Link href="/create">
              <Plus className="size-4" aria-hidden="true" />
              <span>Create listing</span>
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
