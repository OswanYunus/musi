"use client";

const THEMES = {
  green: {
    bg: "#c4af9d",
    text: "#166534",
    textClass: "text-green-800",
    nav: "text-green-800",
    barClass: "bg-green-800",
    accent: "#16a34a",
    markBg: "#c4af9d",
    markBorder: "#222222",
    name: "green",
  },
  black: {
    bg: "#171717",
    text: "#ffffff",
    textClass: "text-white",
    nav: "text-white",
    barClass: "bg-white",
    accent: "#ffffff",
    markBg: "#171717",
    markBorder: "#ffffff",
    name: "black",
  },
  white: {
    bg: "#ffffff",
    text: "#171717",
    textClass: "text-black",
    nav: "text-black",
    barClass: "bg-black",
    accent: "#171717",
    markBg: "#ffffff",
    markBorder: "#171717",
    name: "white",
  },
} as const;

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { isMobile } from "@/utils/device";
import { useVirtualScroll } from "@/hooks/useMomentumScroll";

const ROW1_IMAGE_HEIGHT = "clamp(380px, 52vh, 620px)";
const ROW2_BASE_HEIGHT  = "clamp(380px, 52vh, 620px)";
const ROW2_SMALL_HEIGHT = "clamp(220px, 30vh, 340px)";   // 2.2 — genuinely smaller
const ROW2_LARGE_HEIGHT = "clamp(480px, 62vh, 760px)";   // 2.3

// Row 3 — same container height as row 2 (ROW2_LARGE_HEIGHT as the row height)
// Individual images are smaller and sit inside that space
const ROW3_LARGE_HEIGHT  = "clamp(340px, 46vh, 580px)";  // 3.1 — biggest of row 3
const ROW3_MEDIUM_HEIGHT = "clamp(240px, 32vh, 400px)";  // 3.2 — mid
const ROW3_SMALL_HEIGHT  = "clamp(170px, 22vh, 280px)";  // 3.3 — smallest

const ROW1_PRODUCTS = [
  { id: "1.1", src: "/assets/landing/1.1.png", fill: "/assets/flow/1.01.png", name: "Tarmac Derby", price: "120" },
  { id: "1.2", src: "/assets/landing/1.2.png", fill: "/assets/flow/1.02.png", name: "Poolside Sandal", price: "95" },
  { id: "1.3", src: "/assets/landing/1.3.png", fill: "/assets/flow/1.03.png", name: "Sunwalk Loafer", price: "140" },
  { id: "1.4", src: "/assets/landing/1.4.png", fill: "/assets/flow/1.04.png", name: "Beach Runner", price: "110" },
] as const;

const ROW2_PRODUCTS = [
  { id: "2.1", src: "/assets/landing/2.1.png", fill: "/assets/flow/2.01.png", name: "Trail Walker",  price: "125", imageHeight: ROW2_BASE_HEIGHT,  columnSpan: 1 },
  { id: "2.2", src: "/assets/landing/2.2.png", fill: "/assets/flow/2.02.png", name: "City Slip",     price: "85",  imageHeight: ROW2_SMALL_HEIGHT, columnSpan: 1 },
  { id: "2.3", src: "/assets/landing/2.3.png", fill: "/assets/flow/2.03.png", name: "Highland Boot", price: "165", imageHeight: ROW2_LARGE_HEIGHT, columnSpan: 2 },
] as const;

const ROW3_PRODUCTS = [
  { id: "3.1", src: "/assets/landing/3.1.png", fill: "/assets/flow/3.01.png", name: "Dusk Mule",     price: "105", imageHeight: ROW3_LARGE_HEIGHT,  columnSpan: 1 },
  { id: "3.2", src: "/assets/landing/3.2.png", fill: "/assets/flow/3.02.png", name: "Mesa Clog",     price: "90",  imageHeight: ROW3_MEDIUM_HEIGHT, columnSpan: 1 },
  { id: "3.3", src: "/assets/landing/3.3.png", fill: "/assets/flow/3.03.png", name: "Pebble Slide",  price: "75",  imageHeight: ROW3_SMALL_HEIGHT,  columnSpan: 1 },
] as const;

type Theme = (typeof THEMES)[keyof typeof THEMES];

function shoeFrameSize(
  naturalWidth: number,
  naturalHeight: number,
  boxWidth: number,
  boxHeight: number,
) {
  if (!naturalWidth || !naturalHeight || !boxWidth || !boxHeight) return null;
  const scale = Math.min(boxWidth / naturalWidth, boxHeight / naturalHeight);
  return {
    width: Math.round(naturalWidth * scale),
    height: Math.round(naturalHeight * scale),
  };
}

function ProductCard({
  id,
  src,
  fill,
  name,
  price,
  index,
  imageHeight = ROW1_IMAGE_HEIGHT,
  columnSpan = 1,
  onImageHover,
  onImageLeave,
  textClass = "text-green-800",
}: {
  id: string;
  src: string;
  fill: string;
  name: string;
  price: string;
  index: number;
  imageHeight?: string;
  columnSpan?: number;
  onImageHover?: () => void;
  onImageLeave?: () => void;
  textClass?: string;
}) {
  const [hovering, setHovering] = useState(false);
  const [fillMounted, setFillMounted] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLImageElement>(null);
  const [frame, setFrame] = useState<{ width: number; height: number } | null>(null);

  const syncFrame = () => {
    const box = boxRef.current;
    const main = mainRef.current;
    if (!box || !main?.naturalWidth) return;
    const next = shoeFrameSize(
      main.naturalWidth,
      main.naturalHeight,
      box.clientWidth,
      box.clientHeight,
    );
    if (!next) return;
    setFrame((prev) =>
      prev?.width === next.width && prev?.height === next.height ? prev : next,
    );
  };

  useEffect(() => {
    const box = boxRef.current;
    const main = mainRef.current;
    if (!box || !main) return;

    syncFrame();
    main.addEventListener("load", syncFrame);
    const ro = new ResizeObserver(syncFrame);
    ro.observe(box);
    return () => {
      main.removeEventListener("load", syncFrame);
      ro.disconnect();
    };
  }, [src]);

  const stackStyle = frame
    ? { width: frame.width, height: frame.height }
    : { width: "100%", height: "100%" };

  return (
    <div className="product-card" style={{ flex: `${columnSpan} 1 0` }}>
      <Link
        href={`/product/${id}`}
        className="product-link"
      >
        <div ref={boxRef} className="product-image" style={{ height: imageHeight }}>
          <div
            className="img-stack"
            style={stackStyle}
            onMouseEnter={() => {
              if (!fillMounted) {
                setFillMounted(true);
                requestAnimationFrame(() => {
                  requestAnimationFrame(() => setHovering(true));
                });
              } else {
                setHovering(true);
              }
              onImageHover?.();
            }}
            onMouseLeave={() => {
              setHovering(false);
              onImageLeave?.();
            }}
          >
            <div
              className="img-main-wrap"
              style={{ animationDelay: `${index * 250}ms` }}
            >
              <img ref={mainRef} src={src} alt={id} className="shoe-img" />
            </div>
            {fillMounted && frame && (
              <div
                className={hovering ? "img-overlay img-overlay--in" : "img-overlay img-overlay--out"}
                aria-hidden={!hovering}
              >
                <img
                  src={fill}
                  alt=""
                  className="shoe-img shoe-img--fill"
                />
              </div>
            )}
          </div>
        </div>
      </Link>
      <div
        className="product-caption"
        style={
          frame
            ? { width: frame.width, marginLeft: "auto", marginRight: "auto" }
            : undefined
        }
      >
        <span className={`product-name text-base font-sans ${textClass}`}>{name}</span>
        <span className={`product-price text-base font-sans ${textClass}`}>${price}</span>
      </div>
      <style jsx>{`
        .product-card {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .product-link {
          display: block;
          width: 100%;
          text-decoration: none;
          color: inherit;
          pointer-events: none;
        }
        .product-image {
          position: relative;
          width: 100%;
          pointer-events: none;
        }
        .img-stack {
          position: absolute;
          left: 50%;
          bottom: 0;
          transform: translateX(-50%);
          overflow: hidden;
          pointer-events: auto;
        }
        .img-main-wrap {
          position: relative;
          width: 100%;
          height: 100%;
          transform-origin: left center;
          animation: reveal 500ms ease forwards;
          animation-delay: inherit;
        }
        .img-main-wrap :global(.shoe-img) {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          object-position: center bottom;
        }
        .img-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 5;
          background: #166534;
          will-change: clip-path;
        }
        .img-overlay :global(.shoe-img--fill) {
          width: 100%;
          height: 100%;
          display: block;
          object-fit: contain;
          object-position: center bottom;
          pointer-events: none;
        }
        .img-overlay--out {
          clip-path: inset(0 100% 0 0);
          transition: clip-path 0.65s cubic-bezier(0.77, 0, 0.175, 1);
        }
        .img-overlay--in {
          clip-path: inset(0 0% 0 0);
          transition: clip-path 0.65s cubic-bezier(0.77, 0, 0.175, 1);
        }
        .product-caption {
          display: flex;
          justify-content: space-between;
          width: 100%;
          margin-top: 6px;
          gap: 8px;
        }
        .product-name {
          text-align: left;
          white-space: nowrap;
        }
        .product-price {
          text-align: right;
          white-space: nowrap;
        }
        @keyframes reveal {
          from {
            transform: scaleX(0);
            opacity: 0;
          }
          to {
            transform: scaleX(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

function ThemeSpheres({
  theme,
  onSelectTheme,
}: {
  theme: Theme;
  onSelectTheme: (theme: Theme) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        aria-label="Light mode"
        onClick={() => onSelectTheme(THEMES.white)}
        className="relative focus:outline-none"
        style={{ background: "none", border: "none", padding: 0 }}
      >
        <span
          className="w-5 h-5 rounded-full border border-gray-300 shadow block"
          style={{ background: "#fff", display: "inline-block", position: "relative" }}
        />
        {theme.name === "white" && (
          <span
            className="absolute"
            style={{
              top: -6,
              left: -6,
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "2.5px solid #bbb",
              boxSizing: "border-box",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
        )}
      </button>
      <button
        type="button"
        aria-label="Dark mode"
        onClick={() => onSelectTheme(THEMES.black)}
        className="relative focus:outline-none"
        style={{ background: "none", border: "none", padding: 0 }}
      >
        <span
          className="w-7 h-7 rounded-full border-2 border-gray-700 shadow block"
          style={{ background: "#171717", display: "inline-block", position: "relative" }}
        />
        {theme.name === "black" && (
          <span
            className="absolute"
            style={{
              top: -8,
              left: -8,
              width: 40,
              height: 40,
              borderRadius: "50%",
              border: "3px solid #fff",
              boxSizing: "border-box",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
        )}
      </button>
      <button
        type="button"
        aria-label="Green mode"
        onClick={() => onSelectTheme(THEMES.green)}
        className="relative focus:outline-none"
        style={{ background: "none", border: "none", padding: 0 }}
      >
        <span
          className="w-5 h-5 rounded-full border border-green-900 shadow block"
          style={{ background: "#166534", display: "inline-block", position: "relative" }}
        />
        {theme.name === "green" && (
          <span
            className="absolute"
            style={{
              top: -6,
              left: -6,
              width: 32,
              height: 32,
              borderRadius: "50%",
              border: "2.5px solid #166534",
              boxSizing: "border-box",
              pointerEvents: "none",
              zIndex: 2,
            }}
          />
        )}
      </button>
    </div>
  );
}

function NavBar({
  theme,
  onSelectTheme,
}: {
  theme: Theme;
  onSelectTheme: (theme: Theme) => void;
}) {
  return (
    <div className="fixed top-6 right-8 flex flex-col items-end gap-2 z-30" style={{ pointerEvents: "auto" }}>
      <ThemeSpheres theme={theme} onSelectTheme={onSelectTheme} />
      <div className="flex gap-8 mt-4">
        <Link href="/" className={`underline-anim-btn text-3xl font-serif relative px-2 focus:outline-none group ${theme.nav}`}>
          Shop
          <span className="underline-anim active" />
        </Link>
        <Link href="/bag" className={`underline-anim-btn text-3xl font-serif relative px-2 focus:outline-none group ${theme.nav}`}>
          Bag
          <span className="underline-anim" />
        </Link>
      </div>
    </div>
  );
}

// ─── LOADING SCREEN ───────────────────────────────────────────────────────────
const LOADER_IMAGES = [
  "/assets/landing/l1.png",
  "/assets/landing/l2.png",
  "/assets/landing/l3.png",
  "/assets/landing/l4.png",
  "/assets/landing/l5.png",
  "/assets/landing/l6.png",
];
const CARD_ROTATIONS  = [-11, -6, -2, 4, 9, 15];
const MUSI_CHARS      = ["M", "U", "S", "I", "'", "S"];
const CARD_INTERVAL   = 280;   // ms between each card appearing — slower, more deliberate
const HOLD_AFTER      = 500;   // ms to hold the full stack before collapsing
const COLLAPSE_MS     = 520;   // cards reverse-spin out duration
const CURTAIN_MS      = 680;   // black screen slides up duration

// Loading screen letter order & speed multipliers
// M slides last (order 5), last-S and U together (order 3), U slower (1.7x), middle-S static (no move)
// Index:                     M   U   S(mid)  I   '   S(last)
const LOADER_LETTER_ORDER = [ 5,  3,  -1,     1,  2,  3     ]; // -1 = static
const LOADER_LETTER_SPEED = [ 1,  1.7, 1,     1,  1,  1     ]; // multiplier on duration (higher = slower)

// Landing page — different randomization
// I slides first, M and ' together mid-speed, S(mid) and S(last) together fast, U last and slow
// Index:                      M   U   S(mid)  I   '   S(last)
const LANDING_LETTER_ORDER = [ 2,  5,  3,      0,  2,  3      ];
const LANDING_LETTER_SPEED = [ 1,  1.8, 0.8,   1,  1,  0.8    ];

function LoadingScreen({
  onCurtainStart,
  onDone,
}: {
  onCurtainStart: () => void;   // called when curtain starts rising → landing letters begin
  onDone: () => void;           // called when curtain fully gone
}) {
  const [visibleCount, setVisibleCount] = useState(0);
  // track which letters have been revealed (separate from visibleCount)
  const [revealedLetters, setRevealedLetters] = useState<boolean[]>([false,false,false,false,false,false]);
  const [counter,      setCounter]      = useState(0);
  // phases: idle → stacking → holding → collapsing → curtain → done
  const [phase, setPhase] = useState<"stacking" | "holding" | "collapsing" | "curtain">("stacking");

  // ── stacking: add one card at CARD_INTERVAL, reveal letters by their order ──
  useEffect(() => {
    if (phase !== "stacking") return;
    if (visibleCount >= LOADER_IMAGES.length) {
      // ensure all non-static letters are revealed
      setRevealedLetters([true,true,true,true,true,true]);
      setPhase("holding");
      return;
    }
    const t = setTimeout(() => {
      const next = visibleCount + 1;
      setVisibleCount(next);
      // reveal any letter whose order index <= current card index (0-based step = next-1)
      setRevealedLetters(prev => {
        const updated = [...prev];
        LOADER_LETTER_ORDER.forEach((ord, li) => {
          if (ord !== -1 && ord <= next - 1) updated[li] = true;
        });
        return updated;
      });
    }, visibleCount === 0 ? 80 : CARD_INTERVAL);
    return () => clearTimeout(t);
  }, [visibleCount, phase]);

  // ── counter: animate 0→100 over the stacking window ──────────────────────
  useEffect(() => {
    const totalMs = 80 + CARD_INTERVAL * (LOADER_IMAGES.length - 1);
    const fps = 1000 / 30;
    const steps = totalMs / fps;
    let step = 0;
    const t = setInterval(() => {
      step++;
      const pct = Math.min(step / steps, 1);
      setCounter(Math.round(pct * 100));
      if (pct >= 1) clearInterval(t);
    }, fps);
    return () => clearInterval(t);
  }, []);

  // ── hold then collapse ─────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "holding") return;
    const t = setTimeout(() => setPhase("collapsing"), HOLD_AFTER);
    return () => clearTimeout(t);
  }, [phase]);

  // ── collapse → curtain ────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "collapsing") return;
    const t = setTimeout(() => {
      setPhase("curtain");
      onCurtainStart();
    }, COLLAPSE_MS + 80);
    return () => clearTimeout(t);
  }, [phase, onCurtainStart]);

  // ── curtain done ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (phase !== "curtain") return;
    const t = setTimeout(onDone, CURTAIN_MS + 60);
    return () => clearTimeout(t);
  }, [phase, onDone]);

  const isCollapsing = phase === "collapsing" || phase === "curtain";
  const curtainGone  = phase === "curtain";

  return (
    <div
      aria-hidden
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99998,
        background: "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "all",
        // curtain slides UP via clip-path — same wipe mechanic as img-overlay
        clipPath: curtainGone
          ? "inset(0 0 100% 0)"
          : "inset(0 0 0% 0)",
        transition: curtainGone
          ? `clip-path ${CURTAIN_MS}ms cubic-bezier(0.77, 0, 0.175, 1)`
          : "none",
      }}
    >
      {/* ── layout: [pile + label] [counter] ── */}
      <div style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "clamp(48px, 8vw, 120px)" }}>

        {/* Pile + MUSI'S label above */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 18 }}>

          {/* MUSI'S — letters slide up, each with its own timing */}
          <div style={{ display: "flex", flexDirection: "row", overflow: "hidden", height: "1.05em",
            fontFamily: '"Helvetica Neue LT Std 97 Black Condensed", Helvetica, Arial, sans-serif',
            fontSize: "clamp(2.8rem, 6vw, 5.5rem)",
            fontWeight: 900,
            color: "#ffffff",
            letterSpacing: "-0.03em",
            lineHeight: 1,
          }}>
            {MUSI_CHARS.map((ch, i) => {
              const isStatic = LOADER_LETTER_ORDER[i] === -1;
              const visible  = isStatic || revealedLetters[i];
              const dur      = Math.round(380 * LOADER_LETTER_SPEED[i]);
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    transform: visible ? "translateY(0%)" : "translateY(115%)",
                    opacity: visible ? 1 : 0,
                    transition: visible && !isStatic
                      ? `transform ${dur}ms cubic-bezier(0.16,1,0.3,1),
                         opacity   ${Math.round(dur * 0.55)}ms ease`
                      : "none",
                  }}
                >
                  {ch === "'" ? "\u2019" : ch}
                </span>
              );
            })}
          </div>

          {/* Card stack */}
          <div style={{ position: "relative", width: 160, height: 160, perspective: 600 }}>
            {LOADER_IMAGES.slice(0, visibleCount).map((src, i) => (
              <img
                key={src}
                src={src}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: 4,
                  transformOrigin: "center center",
                  // collapse: reverse-spin back the way they came
                  ...(isCollapsing ? {
                    animation: `card-spin-out-${i} ${COLLAPSE_MS}ms cubic-bezier(0.4,0,0.8,1) both`,
                  } : {
                    // entrance: spin in from flat
                    animation: `card-spin-in-${i} 0.85s cubic-bezier(0.34,1.1,0.64,1) both`,
                  }),
                }}
              />
            ))}
          </div>
          <style>{`
            ${CARD_ROTATIONS.map((rot, i) => `
              @keyframes card-spin-in-${i} {
                0%   { transform: rotate(${rot}deg) rotateY(90deg) scale(0.05); opacity: 0; }
                55%  { opacity: 1; }
                100% { transform: rotate(${rot}deg) rotateY(0deg)  scale(1);    opacity: 1; }
              }
              @keyframes card-spin-out-${i} {
                0%   { transform: rotate(${rot}deg) rotateY(0deg)   scale(1);    opacity: 1; }
                45%  { opacity: 1; }
                100% { transform: rotate(${rot}deg) rotateY(-90deg) scale(0.05); opacity: 0; }
              }
            `).join("")}
          `}</style>
        </div>

        {/* Counter */}
        <div style={{
          fontFamily: '"Helvetica Neue LT Std 97 Black Condensed", Helvetica, Arial, sans-serif',
          fontSize: "clamp(4rem, 10vw, 9rem)",
          fontWeight: 900,
          color: "#ffffff",
          lineHeight: 1,
          letterSpacing: "-0.04em",
          opacity: isCollapsing ? 0 : 1,
          transition: isCollapsing ? `opacity ${COLLAPSE_MS}ms ease` : "none",
          minWidth: "3ch",
          textAlign: "right",
          // clip so digits slide out from bottom like a mechanical counter
          overflow: "hidden",
        }}>
          {String(counter).padStart(3, "0")}
        </div>

      </div>
    </div>
  );
}
// ─── END LOADING SCREEN ───────────────────────────────────────────────────────

export default function Home() {
  const [loading, setLoading] = useState(true);
  const [curtainStarted, setCurtainStarted] = useState(false);
  const cursorRef = useRef<HTMLDivElement>(null);
  const [cursorOverProduct, setCursorOverProduct] = useState(false);
  const [theme, setTheme] = useState<Theme>(THEMES.green);
  const isClient = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );

  // ✨ Virtual scroll — entire page glides with inertia, scrollbar stays native
  useVirtualScroll(0.09);

  useEffect(() => {
    if (!isClient || isMobile()) return;
    document.body.style.cursor = "none";
    const moveCursor = (e: MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + "px";
        cursorRef.current.style.top = e.clientY + "px";
      }
    };
    document.addEventListener("mousemove", moveCursor, { capture: true });
    return () => {
      document.body.style.cursor = "";
      document.removeEventListener("mousemove", moveCursor, { capture: true });
    };
  }, [isClient]);

  // Update body background and text color on theme change
  useEffect(() => {
    document.body.style.background = theme.bg;
    document.body.style.color = theme.text;
  }, [theme]);

  return (
    <>
      {loading && <LoadingScreen onCurtainStart={() => setCurtainStarted(true)} onDone={() => setLoading(false)} />}
      <div
      id="vs-wrapper"
      className="relative min-h-screen w-full flex flex-col"
      style={{ fontFamily: '"Helvetica Neue LT Std 97 Black Condensed", Helvetica, Arial, sans-serif', background: theme.bg, color: theme.text }}
    >
      {/* Main content */}
      <main className="flex flex-col w-full pt-24 px-3 sm:px-4">
        {/* Large MUSI'S text with registered mark */}
        <div className="relative w-full flex flex-col pb-16">
          <h1
            className={`${theme.textClass} text-[13vw] font-black uppercase tracking-tight text-center select-none leading-none`}
            style={{
              fontFamily: '"Helvetica Neue LT Std 97 Black Condensed", Helvetica, Arial, sans-serif',
              letterSpacing: '-0.04em',
              lineHeight: 1.05,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* Per-letter slide — synced with curtain rising, different order from loader */}
            {["M","U","S","I","\u2019","S"].map((ch, i) => {
              const order = LANDING_LETTER_ORDER[i];
              const totalSlots = Math.max(...LANDING_LETTER_ORDER) + 1;
              const slotDelay  = Math.round((CURTAIN_MS * 0.7) / totalSlots);
              const delay      = order * slotDelay;
              const dur        = Math.round(CURTAIN_MS * 0.65 * LANDING_LETTER_SPEED[i]);
              return (
                <span
                  key={i}
                  style={{
                    display: "inline-block",
                    transform: curtainStarted ? "translateY(0%)" : "translateY(115%)",
                    opacity: curtainStarted ? 1 : 0,
                    transition: curtainStarted
                      ? `transform ${dur}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms,
                         opacity   ${Math.round(dur * 0.5)}ms ease ${delay}ms`
                      : "none",
                  }}
                >
                  {ch}
                </span>
              );
            })}
            <span
              style={{
                fontSize: '0.18em',
                position: 'absolute',
                top: '0.18em',
                right: '-1.5em',
                color: theme.markBorder,
                border: `2px solid ${theme.markBorder}`,
                borderRadius: '50%',
                width: '1.1em',
                height: '1.1em',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: theme.markBg,
                fontWeight: 900,
                zIndex: 10,
                transform: curtainStarted ? "translateY(0%)" : "translateY(110%)",
                opacity: curtainStarted ? 1 : 0,
                transition: curtainStarted
                  ? `transform ${CURTAIN_MS}ms cubic-bezier(0.16,1,0.3,1) ${CURTAIN_MS * 0.5}ms,
                     opacity   ${Math.round(CURTAIN_MS * 0.4)}ms ease ${CURTAIN_MS * 0.5}ms`
                  : "none",
              }}
              aria-label="Registered Trademark"
            >
              ®
            </span>
          </h1>
          
          {/* Thick underline and bottom info */}
          <div
            className={`w-full h-4 ${theme.barClass} rounded-full mt-4 relative`}
            style={{
              transform: curtainStarted ? "scaleX(1)" : "scaleX(0)",
              transformOrigin: "left center",
              transition: curtainStarted ? `transform ${CURTAIN_MS}ms cubic-bezier(0.77,0,0.175,1) ${Math.round(CURTAIN_MS * 0.3)}ms` : "none",
            }}
          >
            {/* Bottom row: all in one line using flex */}
            <div className="flex flex-row justify-between items-center w-full px-2 absolute left-0 -bottom-8">
              <span className={`text-base font-sans ${theme.textClass} select-none whitespace-nowrap`}>
                Shoe Collection
              </span>
              <span className={`text-base font-sans ${theme.textClass} select-none whitespace-nowrap`}>
                Original Tough Leather
              </span>
              <button className={`text-base font-sans ${theme.textClass} underline-anim-btn px-2 group whitespace-nowrap`}>
                Who made the website ?
                <span className="underline-anim" />
              </button>
            </div>
          </div>
              {/* Animated underline CSS */}
              <style jsx global>{`
                .underline-anim-btn {
                  background: none;
                  border: none;
                  cursor: pointer;
                  position: relative;
                  padding-bottom: 0.2em;
                }
                .underline-anim {
                  display: block;
                  position: absolute;
                  left: 0;
                  bottom: -2px;
                  height: 4px;
                  width: 100%;
                  background: ${theme.accent};
                  border-radius: 2px;
                  transform: scaleX(0);
                  transform-origin: left;
                  transition: transform 0.35s cubic-bezier(0.77,0,0.175,1);
                  z-index: 1;
                }
                .underline-anim-btn:hover .underline-anim,
                .underline-anim-btn:focus .underline-anim {
                  transform: scaleX(1);
                }
                .underline-anim-btn .underline-anim.active {
                  transform: scaleX(1);
                }
              `}</style>
        </div>

      </main>

      {/* Row 1 */}
      <section className="w-full -mt-2 mb-0 px-3 sm:px-4">
        <div className="flex flex-row items-start gap-3 w-full">
          {ROW1_PRODUCTS.map((p, idx) => (
            <ProductCard
              key={p.id}
              {...p}
              index={idx}
              columnSpan={1}
              textClass={theme.textClass}
              onImageHover={() => setCursorOverProduct(true)}
              onImageLeave={() => setCursorOverProduct(false)}
            />
          ))}
        </div>
      </section>


      {/* Row 2 — match row 1 image logic for full visibility */}
      <section className="w-full mt-32 mb-0 px-3 sm:px-4">
        <div className="flex flex-row items-start gap-3 w-full">
          {ROW2_PRODUCTS.map((p, idx) => (
            <ProductCard
              key={p.id}
              {...p}
              index={idx + ROW1_PRODUCTS.length}
              textClass={theme.textClass}
              onImageHover={() => setCursorOverProduct(true)}
              onImageLeave={() => setCursorOverProduct(false)}
            />
          ))}
        </div>
      </section>


      {/* Row 3 */}
      <section className="w-full mt-32 mb-24 px-3 sm:px-4">
        <div className="flex flex-row items-start gap-3 w-full">
          {ROW3_PRODUCTS.map((p, idx) => (
            <ProductCard
              key={p.id}
              {...p}
              index={idx + ROW1_PRODUCTS.length + ROW2_PRODUCTS.length}
              textClass={theme.textClass}
              onImageHover={() => setCursorOverProduct(true)}
              onImageLeave={() => setCursorOverProduct(false)}
            />
          ))}
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="w-full px-3 sm:px-4 mt-32 pb-12" style={{ color: theme.text }}>
        {/* Top divider — same thick bar style as the MUSI'S underline */}
        <div className={`w-full h-4 ${theme.barClass} rounded-full`} />

        {/* Big tagline + copyright */}
        <div className="flex flex-row items-end justify-between mt-16 mb-16 gap-8">
          <p
            className="leading-none uppercase font-black"
            style={{
              fontFamily: '"Helvetica Neue LT Std 97 Black Condensed", Helvetica, Arial, sans-serif',
              fontSize: "clamp(2.2rem, 5.5vw, 5.5rem)",
              maxWidth: "60%",
              letterSpacing: "-0.03em",
            }}
          >
            Most original tough<br />leather you will get.<br />Wear with pride.
          </p>
          <div
            className="flex items-center gap-3 select-none"
            style={{
              fontSize: "clamp(3rem, 8vw, 8rem)",
              fontWeight: 900,
              lineHeight: 1,
              opacity: 0.9,
            }}
          >
            <span style={{ fontSize: "0.7em" }}>©</span>
            <span style={{ fontSize: "clamp(2rem, 5vw, 5rem)", fontWeight: 900 }}>2026</span>
          </div>
        </div>

        {/* Thin divider */}
        <div className={`w-full ${theme.barClass}`} style={{ height: "1.5px", opacity: 0.35 }} />

        {/* Bottom row */}
        <div className="flex flex-row items-start justify-between mt-4 gap-6">
          {/* Left block */}
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-row items-baseline gap-12 flex-wrap">
              <span className="font-black uppercase text-sm tracking-wide whitespace-nowrap" style={{ fontFamily: '"Helvetica Neue LT Std 97 Black Condensed", Helvetica, Arial, sans-serif' }}>
                Musi&apos;s Collection
              </span>
              <span className="text-sm font-sans opacity-75 whitespace-nowrap">Mombasa</span>
              <button
                className="text-sm font-sans underline-anim-btn group relative whitespace-nowrap"
                style={{ opacity: 0.85 }}
              >
                We value your privacy — read our promise
                <span className="underline-anim" />
              </button>
            </div>
            <div className="flex flex-row items-baseline gap-12 flex-wrap mt-1">
              <span className="text-sm font-sans opacity-75 whitespace-nowrap">All rights reserved © 2026</span>
              <span className="text-sm font-sans opacity-75 whitespace-nowrap">Likoni.</span>
            </div>
          </div>

          {/* Right block — socials */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            {[
              { label: "Instagram", href: "https://instagram.com" },
              { label: "Facebook",  href: "https://facebook.com" },
              { label: "WhatsApp",  href: "https://wa.me" },
              { label: "See who made the website.", href: "#" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="underline-anim-btn group relative text-sm font-sans text-right"
                style={{ opacity: label === "See who made the website." ? 0.6 : 0.85, fontStyle: label === "See who made the website." ? "italic" : "normal" }}
              >
                {label}
                <span className="underline-anim" />
              </a>
            ))}
          </div>
        </div>
      </footer>
      {/* ─── END FOOTER ─── */}

      {/* Logo + nav portalled outside vs-wrapper so transform doesn't affect fixed positioning */}
      {isClient
        ? createPortal(
            <>
              <Link href="/" className="fixed top-2 left-2 z-30" aria-label="Home" style={{ pointerEvents: "auto" }}>
                <Image src="/favicon.ico" alt="Favicon" width={160} height={100} priority />
              </Link>
              <NavBar theme={theme} onSelectTheme={(nextTheme) => setTheme(nextTheme)} />
            </>,
            document.body,
          )
        : null}

      {/* Green custom cursor — portalled to body so it's outside vs-wrapper */}
      {isClient && !isMobile()
        ? createPortal(
        <>
          <div
            ref={cursorRef}
            className={`custom-cursor${cursorOverProduct ? " custom-cursor--expanded" : ""}`}
            aria-hidden
          >
            <span className="custom-cursor__label">view more</span>
          </div>
          <style>{`
            * { cursor: none !important; }
            .custom-cursor {
              pointer-events: none;
              position: fixed;
              z-index: 99999;
              left: 0;
              top: 0;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              background: #16a34a;
              transform: translate(-50%, -50%);
              box-shadow: 0 0 12px 2px #16a34a88;
              opacity: 0.95;
              display: flex;
              align-items: center;
              justify-content: center;
              transition:
                width 0.4s cubic-bezier(0.34, 1.4, 0.64, 1),
                height 0.4s cubic-bezier(0.34, 1.4, 0.64, 1),
                box-shadow 0.4s ease;
            }
            .custom-cursor--expanded {
              width: 112px;
              height: 112px;
              box-shadow: 0 0 24px 4px #16a34a66;
            }
            .custom-cursor__label {
              color: #fff;
              font-family: Helvetica, Arial, sans-serif;
              font-size: 0;
              font-weight: 600;
              letter-spacing: 0.02em;
              text-transform: lowercase;
              line-height: 1.1;
              text-align: center;
              padding: 0 10px;
              opacity: 0;
              transition: opacity 0.25s ease 0.08s, font-size 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
              user-select: none;
            }
            .custom-cursor--expanded .custom-cursor__label {
              font-size: 13px;
              opacity: 1;
            }
          `}</style>
            </>,
            document.body,
          )
        : null}
    </div>
    </>
  );
}