"use client";

import { TransitionLink } from "@/components/RouteTransition";

export default function ShopPage() {
  return (
    <main className="min-h-screen px-6 py-8">
      <TransitionLink
        href="/"
        className="text-black text-xl font-sans underline underline-offset-4"
      >
        ← Back to home
      </TransitionLink>
    </main>
  );
}
