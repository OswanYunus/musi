"use client";

import { TransitionLink } from "@/components/RouteTransition";

export default function BagPage() {
  return (
    <div
      className="min-h-screen w-full bg-[#c4af9d] px-6 py-24"
      style={{ fontFamily: '"Helvetica Neue LT Std 97 Black Condensed", Helvetica, Arial, sans-serif' }}
    >
      <TransitionLink
        href="/shop"
        className="text-green-800 text-xl font-sans underline underline-offset-4"
      >
        ← Back to shop
      </TransitionLink>
      <h1 className="mt-8 text-green-800 text-5xl font-black uppercase">Bag</h1>
      <p className="mt-4 text-green-800 font-sans text-lg max-w-lg">
        Your bag is empty. Checkout with PayPal and M-Pesa will be added here.
      </p>
    </div>
  );
}
