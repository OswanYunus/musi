"use client";

import {
  useEffect, useMemo, useRef, useState, useSyncExternalStore, useCallback,
} from "react";
import { createPortal } from "react-dom";
import gsap from "gsap";
import { TransitionLink } from "@/components/RouteTransition";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useBag } from "@/hooks/useBag";

/* ─── THEME ──────────────────────────────────────────────────────────────────── */
const THEMES = {
  green: { bg: "#c4af9d", text: "#166534", textClass: "text-green-800", nav: "text-green-800", barClass: "bg-green-800", accent: "#16a34a", name: "green" },
  black: { bg: "#171717", text: "#ffffff",  textClass: "text-white",     nav: "text-white",     barClass: "bg-white",     accent: "#ffffff", name: "black" },
  white: { bg: "#ffffff", text: "#171717",  textClass: "text-black",     nav: "text-black",     barClass: "bg-black",     accent: "#171717", name: "white" },
} as const;
type Theme = (typeof THEMES)[keyof typeof THEMES];

/* ─── DATA ───────────────────────────────────────────────────────────────────── */
const IMAGE_ITEMS = [
  { id: "1.1", src: "/assets/shop/1.1.png" }, { id: "1.2", src: "/assets/shop/1.2.png" },
  { id: "1.3", src: "/assets/shop/1.3.png" }, { id: "1.4", src: "/assets/shop/1.4.png" },
  { id: "2.1", src: "/assets/shop/2.1.png" }, { id: "2.2", src: "/assets/shop/2.2.png" },
  { id: "2.3", src: "/assets/shop/2.3.png" }, { id: "2.4", src: "/assets/shop/2.4.png" },
  { id: "3.1", src: "/assets/shop/3.1.png" }, { id: "3.2", src: "/assets/shop/3.2.png" },
  { id: "3.3", src: "/assets/shop/3.3.png" }, { id: "3.4", src: "/assets/shop/3.4.png" },
  { id: "4.1", src: "/assets/shop/4.1.png" }, { id: "4.2", src: "/assets/shop/4.2.png" },
  { id: "4.3", src: "/assets/shop/4.3.png" }, { id: "4.4", src: "/assets/shop/4.4.png" },
  { id: "5.1", src: "/assets/shop/5.1.png" },
];
const PRODUCT_NAMES = [
  "Banana Swing","Cinnamon Dawn","Sisal Breeze","Ochre Glint","Mango Thread",
  "Chestnut Loop","Amber Fold","Caramel Tilt","Hazel Drift","Marigold Curve",
  "Maple Slip","Rustic Palm","Cedar Bloom","Sable Cane","Burnt Sand","Spice Arc","Fawn Halo",
];
const PRICES = [800, 850, 900];

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const a = [...arr]; let s = seed;
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(s) % (i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ─── NAVBAR ─────────────────────────────────────────────────────────────────── */
function ThemeSpheres({ theme, onSelectTheme }: { theme: Theme; onSelectTheme: (t: Theme) => void }) {
  const spheres = [
    { key: "white" as const, bg: "#fff",     border: "border-gray-300",       size: "w-5 h-5", ringSize: 32, ringColor: "#bbb",     ringOffset: -6 },
    { key: "black" as const, bg: "#171717",  border: "border-gray-700 border-2", size: "w-7 h-7", ringSize: 40, ringColor: "#fff", ringOffset: -8 },
    { key: "green" as const, bg: "#166534",  border: "border-green-900",      size: "w-5 h-5", ringSize: 32, ringColor: "#166534",  ringOffset: -6 },
  ];
  return (
    <div className="flex items-center gap-2">
      {spheres.map(({ key, bg, border, size, ringSize, ringColor, ringOffset }) => (
        <button key={key} type="button" aria-label={`${key} mode`}
          onClick={() => onSelectTheme(THEMES[key])}
          className="relative focus:outline-none" style={{ background: "none", border: "none", padding: 0 }}>
          <span className={`${size} rounded-full ${border} shadow block`} style={{ background: bg, display: "inline-block" }} />
          {theme.name === key && (
            <span className="absolute" style={{
              top: ringOffset, left: ringOffset, width: ringSize, height: ringSize,
              borderRadius: "50%", border: `${key === "black" ? 3 : 2.5}px solid ${ringColor}`,
              boxSizing: "border-box", pointerEvents: "none", zIndex: 2,
            }} />
          )}
        </button>
      ))}
    </div>
  );
}

function NavBar({ theme, onSelectTheme }: { theme: Theme; onSelectTheme: (t: Theme) => void }) {
  const pathname = usePathname();
  const { totalItems } = useBag();
  return (
    <div className="fixed top-6 right-8 flex flex-col items-end gap-2 z-30" style={{ pointerEvents: "auto" }}>
      <ThemeSpheres theme={theme} onSelectTheme={onSelectTheme} />
      <div className="flex gap-8 mt-4">
        {[{ href: "/", label: "Home" }, { href: "/shop", label: "Shop" }, { href: "/bag", label: "Bag" }]
          .map(({ href, label }) => (
            <TransitionLink key={href} href={href}
              className={`underline-anim-btn text-3xl font-serif relative px-2 focus:outline-none group ${theme.nav}`}
              style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
              {label}
              {label === "Bag" && totalItems > 0 && (
                <span style={{
                  display: "inline-flex", alignItems: "center", justifyContent: "center",
                  background: "#16a34a", color: "#fff",
                  borderRadius: "999px",
                  minWidth: "1.35rem", height: "1.35rem",
                  fontSize: "0.7rem", fontWeight: 900,
                  letterSpacing: 0,
                  padding: "0 0.3rem",
                  lineHeight: 1,
                  boxShadow: "0 2px 8px rgba(22,163,74,0.45)",
                  transform: "translateY(-0.5rem)",
                  transition: "transform 0.3s cubic-bezier(0.34,1.56,0.64,1)",
                  fontFamily: "Helvetica, Arial, sans-serif",
                }}>
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
              <span className={`underline-anim${pathname === href ? " active" : ""}`} />
            </TransitionLink>
          ))}
      </div>
    </div>
  );
}

/* ─── PRODUCT CARD ───────────────────────────────────────────────────────────── */
type Product = { id: string; src: string; name: string; price: number };

function ShopCard({
  product,
  dimmed,
  onClick,
  theme,
}: {
  product: Product;
  dimmed: boolean;
  onClick: (id: string, rect: DOMRect) => void;
  theme: Theme;
}) {
  const ref = useRef<HTMLElement>(null);

  return (
    <article
      ref={ref}
      className="shop-card"
      onClick={() => {
        if (ref.current) onClick(product.id, ref.current.getBoundingClientRect());
      }}
      style={{
        borderRadius: "1.75rem",
        overflow: "hidden",
        background: "#f5e8d4",
        border: "1px solid rgba(160,110,60,0.16)",
        boxShadow: "0 6px 28px rgba(80,45,15,0.10)",
        display: "flex",
        flexDirection: "column",
        cursor: "pointer",
        transition: "filter 0.45s cubic-bezier(0.4,0,0.2,1), opacity 0.45s cubic-bezier(0.4,0,0.2,1), transform 0.45s cubic-bezier(0.4,0,0.2,1)",
        filter: dimmed ? "blur(7px) brightness(0.65)" : "none",
        opacity: dimmed ? 0.45 : 1,
        transform: dimmed ? "scale(0.96)" : "scale(1)",
        willChange: "filter, opacity, transform",
      }}
    >
      <div style={{
        background: "#f9edd6",
        padding: "2rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        aspectRatio: "1 / 1.15",
      }}>
        <img
          src={product.src}
          alt={product.name}
          style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }}
          loading="lazy"
        />
      </div>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0.85rem 1.25rem",
        borderTop: "1px solid rgba(160,110,60,0.13)",
        gap: "0.5rem",
      }}>
        <span style={{
          fontSize: "clamp(0.72rem,1.1vw,0.88rem)", fontWeight: 700,
          color: theme.text, letterSpacing: "0.02em", textTransform: "uppercase",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{product.name}</span>
        <span style={{
          fontSize: "clamp(0.72rem,1.1vw,0.88rem)", fontWeight: 900,
          color: "#16a34a", whiteSpace: "nowrap", flexShrink: 0,
        }}>Ksh {product.price}</span>
      </div>
    </article>
  );
}

/* ─── HOVER SPOTLIGHT OVERLAY ────────────────────────────────────────────────── */
function SpotlightOverlay({
  product,
  originRect,
  onClose,
  theme,
}: {
  product: Product;
  originRect: DOMRect;
  onClose: () => void;
  theme: Theme;
}) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const cardRef    = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const { addItem } = useBag();

  // Animate in on mount
  useEffect(() => {
    const overlay = overlayRef.current;
    const card    = cardRef.current;
    const controls = controlsRef.current;
    if (!overlay || !card || !controls) return;

    // Backdrop fades in
    gsap.fromTo(overlay, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });

    // Card springs in from the small card's position.
    // Read the card's actual rendered center after CSS positions it.
    const cardRect = card.getBoundingClientRect();
    const cardCX = cardRect.left + cardRect.width / 2;
    const cardCY = cardRect.top + cardRect.height / 2;
    const originCX = originRect.left + originRect.width / 2;
    const originCY = originRect.top + originRect.height / 2;
    const fromScale = originRect.width / (cardRect.width * 0.58 || 1);

    gsap.fromTo(card,
      {
        x: originCX - cardCX,
        y: originCY - cardCY,
        scale: fromScale,
        opacity: 0,
      },
      {
        x: 0, y: 0, scale: 1, opacity: 1,
        duration: 0.55,
        ease: "back.out(1.4)",
      },
    );

    gsap.fromTo(controls,
      { y: 18, opacity: 0 },
      { y: 0,  opacity: 1, duration: 0.4, ease: "power3.out", delay: 0.3 },
    );
  }, [originRect]);

  // Animate out, then call onClose
  const dismiss = useCallback(() => {
    const overlay = overlayRef.current;
    const card    = cardRef.current;
    if (!overlay || !card) { onClose(); return; }

    const cardRect = card.getBoundingClientRect();
    const cardCX = cardRect.left + cardRect.width / 2;
    const cardCY = cardRect.top + cardRect.height / 2;
    const originCX = originRect.left + originRect.width / 2;
    const originCY = originRect.top + originRect.height / 2;
    const fromScale = originRect.width / (cardRect.width * 0.58 || 1);

    gsap.to(card, {
      x: originCX - cardCX,
      y: originCY - cardCY,
      scale: fromScale,
      opacity: 0,
      duration: 0.38,
      ease: "power3.in",
    });
    gsap.to(overlay, {
      opacity: 0, duration: 0.38, ease: "power2.in",
      onComplete: onClose,
    });
  }, [originRect, onClose]);

  const handleAddToBag = () => {
    addItem({ id: product.id, name: product.name, price: product.price, src: product.src, qty });
    setAdded(true);
    setTimeout(() => { setAdded(false); dismiss(); }, 900);
  };

  return (
    <div
      ref={overlayRef}
      onClick={dismiss}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 200,
        pointerEvents: "all",
        cursor: "default",
        background: "radial-gradient(ellipse at center, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.42) 100%)",
      }}
    >
      {/* Floating card — anchored near the clicked card's position */}
      <div
        ref={cardRef}
        onClick={e => e.stopPropagation()}
        onMouseLeave={dismiss}
        style={{
          pointerEvents: "all",
          position: "absolute",
          // Vertically center in viewport
          top: "50%",
          // Horizontally: align card center with the clicked card's center, clamped to screen
          left: Math.min(
            Math.max(
              originRect.left + originRect.width / 2,
              Math.min(window.innerWidth * 0.45, 390)
            ),
            window.innerWidth - Math.min(window.innerWidth * 0.45, 390)
          ),
          transform: "translate(-50%, -50%)",
          display: "flex",
          flexDirection: "row",
          alignItems: "stretch",
          gap: "0",
          borderRadius: "2.25rem",
          overflow: "hidden",
          boxShadow: "0 32px 96px rgba(20,10,5,0.38), 0 4px 16px rgba(20,10,5,0.18)",
          width: "min(90vw, 780px)",
          background: "transparent",
          transformOrigin: "center center",
        }}
      >
        {/* Left — shoe image, no background */}
        <div style={{
          flex: "0 0 58%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem 1.5rem 2.5rem 2.5rem",
          background: "transparent",
          position: "relative",
        }}>
          <img
            src={product.src}
            alt={product.name}
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "55vh",
              objectFit: "contain",
              display: "block",
              filter: "drop-shadow(0 24px 48px rgba(0,0,0,0.32))",
            }}
          />
        </div>

        {/* Right — controls panel */}
        <div
          ref={controlsRef}
          style={{
            flex: "1",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            gap: "1.6rem",
            padding: "2.5rem 2.5rem 2.5rem 1.5rem",
            background: "rgba(245,232,212,0.96)",
            backdropFilter: "blur(12px)",
            borderLeft: "1px solid rgba(160,110,60,0.15)",
          }}
        >
          {/* Name + price */}
          <div>
            <p style={{
              fontSize: "clamp(1.1rem,2.2vw,1.5rem)",
              fontWeight: 900,
              color: "#2a1a0e",
              letterSpacing: "-0.02em",
              textTransform: "uppercase",
              lineHeight: 1.1,
              marginBottom: "0.4rem",
            }}>{product.name}</p>
            <p style={{
              fontSize: "clamp(1rem,1.8vw,1.3rem)",
              fontWeight: 900,
              color: "#16a34a",
            }}>Ksh {product.price}</p>
          </div>

          {/* Quantity counter */}
          <div>
            <p style={{
              fontSize: "0.7rem",
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "#7a5c3f",
              marginBottom: "0.6rem",
            }}>Quantity</p>
            <div style={{
              display: "inline-flex",
              alignItems: "center",
              border: "1.5px solid rgba(160,110,60,0.35)",
              borderRadius: "999px",
              overflow: "hidden",
              background: "#fff8f0",
            }}>
              <button
                onClick={() => setQty(q => Math.max(1, q - 1))}
                style={{
                  width: "2.4rem", height: "2.4rem",
                  background: "none", border: "none",
                  fontSize: "1.3rem", fontWeight: 900,
                  color: "#3a2410", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(160,110,60,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >−</button>
              <span style={{
                minWidth: "2rem", textAlign: "center",
                fontSize: "1rem", fontWeight: 900, color: "#2a1a0e",
              }}>{qty}</span>
              <button
                onClick={() => setQty(q => q + 1)}
                style={{
                  width: "2.4rem", height: "2.4rem",
                  background: "none", border: "none",
                  fontSize: "1.3rem", fontWeight: 900,
                  color: "#3a2410", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "background 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "rgba(160,110,60,0.1)")}
                onMouseLeave={e => (e.currentTarget.style.background = "none")}
              >+</button>
            </div>
          </div>

          {/* Add to bag */}
          <button
            onClick={handleAddToBag}
            style={{
              padding: "0.85rem 1.5rem",
              borderRadius: "999px",
              border: "none",
              background: added ? "#15803d" : "#16a34a",
              color: "#fff",
              fontSize: "0.82rem",
              fontWeight: 900,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "background 0.25s ease, transform 0.2s ease",
              transform: added ? "scale(0.97)" : "scale(1)",
              boxShadow: "0 4px 18px rgba(22,163,74,0.35)",
            }}
            onMouseEnter={e => { if (!added) (e.currentTarget as HTMLButtonElement).style.background = "#15803d"; }}
            onMouseLeave={e => { if (!added) (e.currentTarget as HTMLButtonElement).style.background = "#16a34a"; }}
          >
            {added ? "✓ Added to bag" : `Add to bag — Ksh ${product.price * qty}`}
          </button>

          <p style={{
            fontSize: "0.68rem",
            color: "#a07850",
            letterSpacing: "0.06em",
            textTransform: "uppercase",
          }}>Move away to close</p>
        </div>
      </div>
    </div>
  );
}

/* ─── SHOP PAGE ──────────────────────────────────────────────────────────────── */
export default function ShopPage() {
  const [theme, setTheme]       = useState<Theme>(THEMES.green);
  const [current, setCurrent]   = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [hoveredId, setHoveredId]     = useState<string | null>(null);
  const [spotlightProduct, setSpotlightProduct] = useState<Product | null>(null);
  const [spotlightRect, setSpotlightRect]       = useState<DOMRect | null>(null);
  const rowRefs  = useRef<Array<HTMLDivElement | null>>([]);
  const isClient = useSyncExternalStore(() => () => {}, () => true, () => false);

  const products = useMemo(() => {
    const names  = seededShuffle(PRODUCT_NAMES, 42);
    const prices = seededShuffle(PRICES, 43);
    return IMAGE_ITEMS.map((item, i) => ({
      ...item,
      name:  names[i % names.length],
      price: prices[i % prices.length],
    }));
  }, []);

  const rows = useMemo(() => {
    const grouped: Record<string, typeof products> = {};
    products.forEach((p) => {
      const key = p.id.split(".")[0];
      grouped[key] = grouped[key] || [];
      grouped[key].push(p);
    });
    return Object.keys(grouped).sort().map((k) => grouped[k]);
  }, [products]);

  const totalRows = rows.length;

  useEffect(() => {
    document.body.style.background = theme.bg;
    document.body.style.color = theme.text;
  }, [theme]);

  useEffect(() => {
    rowRefs.current.forEach((el, i) => {
      if (!el) return;
      gsap.set(el, { y: i === 0 ? 0 : "100%", autoAlpha: i === 0 ? 1 : 0 });
    });
  }, [rows]);

  useEffect(() => {
    const el = rowRefs.current[0];
    if (!el) return;
    const cards = el.querySelectorAll<HTMLElement>(".shop-card");
    gsap.fromTo(cards,
      { y: 44, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.7, stagger: 0.09, ease: "power3.out", delay: 0.1 },
    );
  }, [rows]);

  function goToRow(next: number) {
    if (isAnimating || next === current || next < 0 || next >= totalRows) return;
    setIsAnimating(true);
    setHoveredId(null);
    setSpotlightProduct(null);
    const fromEl = rowRefs.current[current];
    const toEl   = rowRefs.current[next];
    if (!fromEl || !toEl) { setIsAnimating(false); return; }

    const forward = next > current;
    gsap.set(toEl, { y: forward ? "100%" : "-100%", autoAlpha: 1 });

    const tl = gsap.timeline({ onComplete: () => { setCurrent(next); setIsAnimating(false); } });
    tl.to(fromEl, { y: forward ? "-100%" : "100%", duration: 0.75, ease: "power3.inOut" }, 0);
    tl.to(toEl,   { y: 0, duration: 0.75, ease: "power3.inOut" }, 0);

    const cards = toEl.querySelectorAll<HTMLElement>(".shop-card");
    gsap.fromTo(cards,
      { y: forward ? 50 : -50, autoAlpha: 0 },
      { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.08, ease: "power3.out", delay: 0.35 },
    );
  }

  // Card click handler — opens spotlight for the clicked product
  const handleCardClick = useCallback((id: string, rect: DOMRect) => {
    const product = products.find(p => p.id === id);
    if (product) {
      setHoveredId(id);
      setSpotlightProduct(product);
      setSpotlightRect(rect);
    }
  }, [products]);

  const closeSpotlight = useCallback(() => {
    setSpotlightProduct(null);
    setSpotlightRect(null);
    setHoveredId(null);
  }, []);

  // Wheel/touch/key scroll
  useEffect(() => {
    let cooldown = false;
    let touchY   = 0;
    const onWheel = (e: WheelEvent) => {
      if (spotlightProduct) return; // don't scroll while spotlight open
      e.preventDefault();
      if (cooldown || isAnimating) return;
      cooldown = true;
      setTimeout(() => { cooldown = false; }, 900);
      goToRow(e.deltaY > 0 ? current + 1 : current - 1);
    };
    const onTouchStart = (e: TouchEvent) => { touchY = e.touches[0].clientY; };
    const onTouchEnd   = (e: TouchEvent) => {
      if (spotlightProduct) return;
      const diff = touchY - e.changedTouches[0].clientY;
      if (Math.abs(diff) < 40) return;
      goToRow(diff > 0 ? current + 1 : current - 1);
    };
    const onKey = (e: KeyboardEvent) => {
      if (spotlightProduct) { if (e.key === "Escape") closeSpotlight(); return; }
      if (e.key === "ArrowDown" || e.key === "PageDown") goToRow(current + 1);
      if (e.key === "ArrowUp"   || e.key === "PageUp")   goToRow(current - 1);
    };
    window.addEventListener("wheel",      onWheel,      { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend",   onTouchEnd,   { passive: true });
    window.addEventListener("keydown",    onKey);
    return () => {
      window.removeEventListener("wheel",      onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend",   onTouchEnd);
      window.removeEventListener("keydown",    onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, isAnimating, spotlightProduct]);

  return (
    <>
      <div style={{
        position: "fixed", inset: 0, overflow: "hidden",
        background: theme.bg,
        fontFamily: '"Helvetica Neue LT Std 97 Black Condensed", Helvetica, Arial, sans-serif',
        transition: "background 0.4s ease",
      }}>
        {/* Row slides */}
        {rows.map((row, rowIndex) => (
          <div
            key={`row-${rowIndex}`}
            ref={(el) => { rowRefs.current[rowIndex] = el as HTMLDivElement | null; }}
            style={{
              position: "absolute", inset: 0,
              display: "flex", flexDirection: "column", justifyContent: "center",
              padding: "5.5rem 4.5rem 2rem 2.5rem",
              willChange: "transform, opacity",
            }}
          >
            <div style={{
              display: "grid",
              gridTemplateColumns: row.length === 1
                ? "minmax(0, 420px)"
                : `repeat(${Math.min(row.length, 4)}, minmax(0, 1fr))`,
              gap: "2rem",           // ← wider gap between cards
              justifyContent: row.length === 1 ? "center" : "stretch",
              width: "100%",
              maxWidth: "1440px",
              margin: "0 auto",
            }}>
              {row.map((product) => (
                <ShopCard
                  key={product.id}
                  product={product}
                  dimmed={hoveredId !== null}
                  onClick={handleCardClick}
                  theme={theme}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Dot rail — right edge */}
        <div style={{
          position: "fixed", right: "1.4rem", top: "50%",
          transform: "translateY(-50%)", zIndex: 40,
          display: "flex", flexDirection: "column", alignItems: "center", gap: "10px",
        }}>
          {rows.map((_, i) => (
            <button key={i} onClick={() => goToRow(i)}
              aria-label={`Go to row ${i + 1}`} title={`Row ${i + 1}`}
              style={{
                width: 8, height: i === current ? 28 : 8,
                borderRadius: 999,
                background: i === current ? "#16a34a" : "rgba(80,50,20,0.28)",
                border: "none", cursor: "pointer", padding: 0, flexShrink: 0,
                transition: "height 0.35s cubic-bezier(0.77,0,0.175,1), background 0.3s ease",
              }}
            />
          ))}
        </div>
      </div>

      {/* Spotlight overlay — portalled so it escapes fixed container */}
      {isClient && spotlightProduct && spotlightRect && createPortal(
        <SpotlightOverlay
          product={spotlightProduct}
          originRect={spotlightRect}
          onClose={closeSpotlight}
          theme={theme}
        />,
        document.body,
      )}

      {/* Navbar + logo — portalled to body */}
      {isClient && createPortal(
        <>
          <TransitionLink href="/" className="fixed top-2 left-2 z-30" aria-label="Home" style={{ pointerEvents: "auto" }}>
            <Image src="/favicon.ico" alt="Favicon" width={160} height={100} priority />
          </TransitionLink>
          <NavBar theme={theme} onSelectTheme={setTheme} />
        </>,
        document.body,
      )}
    </>
  );
}