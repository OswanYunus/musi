"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { usePathname, useRouter } from "next/navigation";

const MUSI_CHARS = ["M", "U", "S", "I", "\u2019", "S"];
const CURTAIN_MS = 680;
const LETTER_ORDER = [4, 2, 0, 1, 3, 0];
const LETTER_SPEED = [1.1, 1.5, 0.7, 1, 0.9, 0.7];

// ─── CURTAIN SCREEN ──────────────────────────────────────────────────────────
// Portalled to document.body so fixed positioning is never trapped inside
// a transformed / fixed ancestor (e.g. the shop page's fixed container).
//
// Phase machine:
//   "enter" — black curtain fully covers; letters animate in
//   "hold"  — router.push fired; curtain stays solid while Next mounts new page
//   "exit"  — new page painted; curtain lifts upward
function RouteTransitionScreen({
  targetHref,
  onNavigate,
  onExitDone,
}: {
  targetHref: string;
  onNavigate: () => void;
  onExitDone: () => void;
}) {
  const [isMounted, setIsMounted] = useState(false);
  const [lettersVisible, setLettersVisible] = useState(false);
  const [phase, setPhase] = useState<"enter" | "hold" | "exit">("enter");
  const pathname = usePathname();
  const navigatedRef = useRef(false);
  const onNavigateRef = useRef(onNavigate);
  const onExitDoneRef = useRef(onExitDone);

  useEffect(() => {
    onNavigateRef.current = onNavigate;
    onExitDoneRef.current = onExitDone;
  }, [onNavigate, onExitDone]);

  // Ensure we're mounted before rendering portal to prevent hydration mismatch
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Step 1 — animate letters in, then fire router.push
  useEffect(() => {
    const t1 = window.setTimeout(() => setLettersVisible(true), 60);
    const t2 = window.setTimeout(() => {
      if (!navigatedRef.current) {
        navigatedRef.current = true;
        onNavigateRef.current();
        setPhase("hold");
      }
    }, 700);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
    };
  }, []);

  // Step 2 — pathname changed = new page mounted; wait one paint then lift
  useEffect(() => {
    if (phase !== "hold") return;
    if (pathname !== targetHref) return;
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setPhase("exit")),
    );
    return () => cancelAnimationFrame(raf);
  }, [phase, pathname, targetHref]);

  // Step 3 — curtain has finished lifting; unmount
  useEffect(() => {
    if (phase !== "exit") return;
    const t = window.setTimeout(() => onExitDoneRef.current(), CURTAIN_MS + 60);
    return () => window.clearTimeout(t);
  }, [phase]);

  const screen = (
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
        clipPath: phase === "exit" ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)",
        transition:
          phase === "exit"
            ? `clip-path ${CURTAIN_MS}ms cubic-bezier(0.77,0,0.175,1)`
            : "none",
      }}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          overflow: "hidden",
          fontFamily:
            '"Helvetica Neue LT Std 97 Black Condensed",Helvetica,Arial,sans-serif',
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
                  ? `transform ${dur}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms,
                     opacity   ${Math.round(dur * 0.5)}ms ease ${delay}ms`
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

  // Portal straight to body — escapes any stacking context
  // Only render after mount to prevent hydration mismatch
  if (!isMounted) return null;
  return createPortal(screen, document.body);
}

// ─── TRANSITION LINK ─────────────────────────────────────────────────────────
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
  const [active, setActive] = useState(false);

  const handleNavigate = useCallback(() => {
    router.push(href);
  }, [href, router]);

  const handleExitDone = useCallback(() => {
    setActive(false);
  }, []);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>) => {
      props.onClick?.(event);
      if (event.defaultPrevented) return;
      if (
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        event.button !== 0 ||
        target === "_blank"
      )
        return;
      if (!href.startsWith("/")) return;
      event.preventDefault();
      setActive(true);
    },
    [href, props, target],
  );

  return (
    <>
      {active && (
        <RouteTransitionScreen
          targetHref={href}
          onNavigate={handleNavigate}
          onExitDone={handleExitDone}
        />
      )}
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