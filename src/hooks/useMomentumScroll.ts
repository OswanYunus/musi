"use client";

import { useEffect, useRef } from "react";

/**
 * useVirtualScroll
 *
 * Virtual / inertia scroll — the outfit.hellohello.is feel.
 *
 * How it works:
 * - The page wrapper becomes position:fixed, overflow:hidden
 * - A spacer div sets the real document height (so the scrollbar is correct)
 * - window.scrollY is the TARGET
 * - A lerp loop chases the target and applies translateY(-lerpedY) to the wrapper
 * - Result: scrollbar moves normally, content glides and coasts
 *
 * @param ease  0–1. 0.07 = heavy cinematic glide, 0.1 = medium, 0.15 = light
 */
export function useVirtualScroll(ease = 0.09) {
  const wrapperRef = useRef<HTMLElement | null>(null);
  const spacerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    // Find or create the spacer
    let spacer = document.getElementById("vs-spacer") as HTMLElement | null;
    if (!spacer) {
      spacer = document.createElement("div");
      spacer.id = "vs-spacer";
      spacer.style.cssText = "position:fixed;top:0;left:0;width:1px;pointer-events:none;visibility:hidden;";
      document.body.appendChild(spacer);
    }
    spacerRef.current = spacer;

    // The wrapper is the first child of body that contains the page
    const wrapper = document.getElementById("vs-wrapper") as HTMLElement | null;
    if (!wrapper) return;
    wrapperRef.current = wrapper;

    // Fix the wrapper in place
    wrapper.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      overflow: hidden;
      will-change: transform;
    `;

    let currentY = 0;
    let rafId: number;

    function setBodyHeight() {
      document.body.style.height = wrapper!.scrollHeight + "px";
    }

    // Keep body height in sync with content height
    const ro = new ResizeObserver(setBodyHeight);
    ro.observe(wrapper);
    setBodyHeight();

    function tick() {
      const targetY = window.scrollY;
      currentY += (targetY - currentY) * ease;

      // Snap when close enough
      if (Math.abs(targetY - currentY) < 0.05) {
        currentY = targetY;
      }

      wrapper!.style.transform = `translateY(${-currentY}px)`;
      rafId = requestAnimationFrame(tick);
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
      // Restore on unmount
      wrapper.style.cssText = "";
      document.body.style.height = "";
      spacer?.remove();
    };
  }, [ease]);
}