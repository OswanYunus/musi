"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const MUSI_CHARS = ["M", "U", "S", "I", "\u2019", "S"];
const CURTAIN_MS = 680;
const LETTER_ORDER = [4, 2, 0, 1, 3, 0];
const LETTER_SPEED = [1.1, 1.5, 0.7, 1, 0.9, 0.7];

export function RouteTransitionScreen({ onDone }: { onDone: () => void }) {
  const [phase, setPhase] = useState<"show" | "curtain">("show");
  const [lettersVisible, setLettersVisible] = useState(false);

  useEffect(() => {
    const t1 = window.setTimeout(() => setLettersVisible(true), 60);
    const t2 = window.setTimeout(() => setPhase("curtain"), 820);
    const t3 = window.setTimeout(onDone, 820 + CURTAIN_MS + 60);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [onDone]);

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "all",
        clipPath: phase === "curtain" ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)",
        transition: phase === "curtain" ? `clip-path ${CURTAIN_MS}ms cubic-bezier(0.77,0,0.175,1)` : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
          fontFamily: '"Helvetica Neue LT Std 97 Black Condensed",Helvetica,Arial,sans-serif',
          fontSize: "clamp(4rem,10vw,9rem)",
          fontWeight: 900,
          color: "#fff",
          letterSpacing: "-0.04em",
          lineHeight: 1,
        }}
      >
        {MUSI_CHARS.map((ch, i) => {
          const dur = Math.round(400 * LETTER_SPEED[i]);
          const delay = LETTER_ORDER[i] * 60;
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                transform: lettersVisible ? "translateY(0%)" : "translateY(110%)",
                opacity: lettersVisible ? 1 : 0,
                transition: lettersVisible
                  ? `transform ${dur}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, opacity ${Math.round(
                      dur * 0.5,
                    )}ms ease ${delay}ms`
                  : "none",
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
    </div>
  );
}

export function TransitionLink({
  href,
  children,
  className,
  style,
  target,
  rel,
  ...props
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  target?: string;
  rel?: string;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const router = useRouter();
  const [transitioning, setTransitioning] = useState(false);
  const [pendingHref, setPendingHref] = useState<string | null>(null);

  const handleDone = useCallback(() => {
    if (!pendingHref) return;
    router.push(pendingHref);
    setPendingHref(null);
    setTransitioning(false);
  }, [pendingHref, router]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      props.onClick?.(event as any);
      if (event.defaultPrevented) return;
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0 ||
        target === "_blank"
      ) {
        return;
      }
      if (!href.startsWith("/")) return;
      event.preventDefault();
      setPendingHref(href);
      setTransitioning(true);
    },
    [href, props, target],
  );

  return (
    <>
      {transitioning && <RouteTransitionScreen onDone={handleDone} />}
      <a
        href={href}
        onClick={handleClick}
        className={className}
        style={style}
        target={target}
        rel={rel}
        {...props}
      >
        {children}
      </a>
    </>
  );
}
