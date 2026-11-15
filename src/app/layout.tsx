import { Suspense } from "react";
import type { Metadata } from "next";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource-variable/outfit";
import "./globals.css";
import { Header } from "@/components/layout/header";
import { Sidebar } from "@/components/layout/sidebar";

export const metadata: Metadata = {
  title: "Mini-Marketplace | Local Buy & Sell",
  description:
    "Discover local deals on electronics, furniture, vehicles, and more. Post a listing in seconds with no login required.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#F4F6FB] text-[#0F172A]">
        <Suspense
          fallback={
            <header className="sticky top-0 z-40 w-full border-b border-[#E2E8F0] bg-white/95 backdrop-blur-md">
              <div className="h-[3px] w-full bg-gradient-to-r from-[#1877F2] via-[#4338CA] to-[#06B6D4]" />
              <div className="h-[61px] w-full" />
            </header>
          }
        >
          <Header />
        </Suspense>

        <div className="flex flex-1 min-h-0">
          <aside className="hidden lg:block w-60 shrink-0 border-r border-[#E2E8F0] bg-[#FAFBFD]">
            <div className="sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
              <Suspense
                fallback={
                  <div className="flex h-full flex-col gap-3 p-4">
                    <div className="h-6 w-32 animate-pulse rounded bg-[#E2E8F0]" />
                    <div className="mt-2 h-9 w-full animate-pulse rounded-xl bg-[#E2E8F0]" />
                    <div className="mt-2 space-y-2">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div
                          key={i}
                          className="h-9 w-full animate-pulse rounded-xl bg-[#F1F5F9]"
                        />
                      ))}
                    </div>
                  </div>
                }
              >
                <Sidebar />
              </Suspense>
            </div>
          </aside>

          <main className="flex-1 min-w-0 bg-[#F4F6FB]">{children}</main>
        </div>
      </body>
    </html>
  );
}
