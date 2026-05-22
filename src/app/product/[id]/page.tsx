"use client";

// Place this file at: app/product/[id]/page.tsx
//
// SCROLL ARCHITECTURE — mirrors outfit.hellohello.is product page:
//
//   The entire page uses the same virtual/momentum scroll as the landing page.
//   The left image column is NOT a separate scroll container.
//   Instead, the page has THREE stacking "sections":
//
//     [A]  100vh  — right panel content (sticky) + left image 1 (sticky beside it)
//     [B]  100vh  — left image 2 scrolls into view while right stays frozen
//     [C]  footer — appears after both images have passed
//
//   How "right stays frozen while left scrolls":
//     • Left column:  position sticky, top 0            — sticks through [A]+[B]
//     • Right column: position sticky, top 0, height vh — sticks through [A] only
//       (it is inside a wrapper div whose height = 100vh, so it un-sticks at [B])
//
//   Net effect:
//     Scrolling through [A]: both columns visible, right has details, left shows image 1
//     Scrolling through [B]: right column has exited its sticky wrapper and disappears
//                            (or stays at its natural place), left column slides image 2 in
//     Reaching [C]: footer appears full-width
//
//   Scrolling UP from footer: left images scroll back, right re-appears as user scrolls
//   back into [A].
//
//   The momentum scroll (useVirtualScroll) is applied to the outer wrapper exactly
//   as in the landing page.

import Image from "next/image";
import { TransitionLink } from "@/components/RouteTransition";
import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { useParams } from "next/navigation";
import { useVirtualScroll } from "@/hooks/useMomentumScroll";
import { isMobile } from "@/utils/device";

// ─── THEMES ────────────────────────────────────────────────────────────────────
const THEMES = {
  green: { bg: "#c4af9d", text: "#166534", nav: "text-green-800", accent: "#16a34a", name: "green" },
  black: { bg: "#171717", text: "#ffffff",  nav: "text-white",     accent: "#ffffff", name: "black" },
  white: { bg: "#ffffff", text: "#171717",  nav: "text-black",     accent: "#171717", name: "white" },
} as const;
type Theme = (typeof THEMES)[keyof typeof THEMES];

// ─── PRODUCTS ──────────────────────────────────────────────────────────────────
const ALL_PRODUCTS = [
  { id: "1.1", src: "/assets/landing/1.1.png", fill: "/assets/flow/1.01.png", name: "Tarmac Derby",    price: "120", inStock: true,  description: "Built for the streets that never sleep. The Tarmac Derby is handcrafted from full-grain leather with a sole that absorbs city noise and returns energy. Every stitch is intentional — minimal, purposeful, lasting." },
  { id: "1.2", src: "/assets/landing/1.2.png", fill: "/assets/flow/1.02.png", name: "Poolside Sandal", price: "95",  inStock: true,  description: "Where water meets leather. The Poolside Sandal uses water-resistant treated hide over a cork-infused footbed that molds to your arch over time. Wear them wet, dry, or somewhere in between." },
  { id: "1.3", src: "/assets/landing/1.3.png", fill: "/assets/flow/1.03.png", name: "Sunwalk Loafer",  price: "140", inStock: false, description: "A loafer refined over six seasons of iteration. The Sunwalk is cut from vegetable-tanned leather that deepens in colour with every mile. Slip-on ease with a silhouette that holds its shape for decades." },
  { id: "1.4", src: "/assets/landing/1.4.png", fill: "/assets/flow/1.04.png", name: "Beach Runner",    price: "110", inStock: true,  description: "Sand-ready and street-worthy. The Beach Runner pairs a breathable mesh inner with a sealed leather upper — the combination handles coastal terrain and evening cobblestones with equal composure." },
  { id: "2.1", src: "/assets/landing/2.1.png", fill: "/assets/flow/2.01.png", name: "Trail Walker",    price: "125", inStock: true,  description: "Elevation-rated leather for technical paths. The Trail Walker features a reinforced toe cap, triple-stitched seams, and a lug sole made from recycled natural rubber. Goes where polished shoes dare not follow." },
  { id: "2.2", src: "/assets/landing/2.2.png", fill: "/assets/flow/2.02.png", name: "City Slip",       price: "85",  inStock: false, description: "The City Slip was designed in five minutes and took three months to perfect. Zero-fuss slip-on construction over a leather lining so smooth it feels like it was made for your foot specifically." },
  { id: "2.3", src: "/assets/landing/2.3.png", fill: "/assets/flow/2.03.png", name: "Highland Boot",   price: "165", inStock: true,  description: "Cut from a single piece of bridle leather where possible. The Highland Boot ages dramatically — cream it, scratch it, walk it through wet grass. In ten years it will look better than the day you bought it." },
  { id: "3.1", src: "/assets/landing/3.1.png", fill: "/assets/flow/3.01.png", name: "Dusk Mule",       price: "105", inStock: true,  description: "The hour between afternoon and evening inspired every curve of the Dusk Mule. Backless, effortless, and cut with enough structure to hold a silhouette. Leather that moves the way you do." },
  { id: "3.2", src: "/assets/landing/3.2.png", fill: "/assets/flow/3.02.png", name: "Mesa Clog",       price: "90",  inStock: false, description: "Sculpted from a single wooden form. The Mesa Clog wraps that form in thick, pliable leather that breaks in fast and wears for years. The heel click when you walk is deeply satisfying." },
  { id: "3.3", src: "/assets/landing/3.3.png", fill: "/assets/flow/3.03.png", name: "Pebble Slide",    price: "75",  inStock: true,  description: "Named after the stones it was tested on. The Pebble Slide is the most minimal thing we make — two straps, one moulded footbed, zero compromise on material. Small shoe. Big presence." },
] as const;

// ─── LOADING SCREEN (MUSI'S curtain only — no card stack) ─────────────────────
const MUSI_CHARS   = ["M","U","S","I","\u2019","S"];
const CURTAIN_MS   = 680;
const LETTER_ORDER = [4,2,0,1,3,0];
const LETTER_SPEED = [1.1,1.5,0.7,1,0.9,0.7];

function ProductLoadingScreen({ onCurtainStart, onDone }: { onCurtainStart:()=>void; onDone:()=>void }) {
  const [phase,          setPhase]          = useState<"show"|"curtain">("show");
  const [lettersVisible, setLettersVisible] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setLettersVisible(true), 60);
    const t2 = setTimeout(() => { setPhase("curtain"); onCurtainStart(); }, 820);
    const t3 = setTimeout(onDone, 820 + CURTAIN_MS + 60);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [onCurtainStart, onDone]);

  return (
    <div aria-hidden style={{
      position:"fixed", inset:0, zIndex:99998, background:"#0a0a0a",
      display:"flex", alignItems:"center", justifyContent:"center", pointerEvents:"all",
      clipPath: phase==="curtain" ? "inset(0 0 100% 0)" : "inset(0 0 0% 0)",
      transition: phase==="curtain" ? `clip-path ${CURTAIN_MS}ms cubic-bezier(0.77,0,0.175,1)` : "none",
    }}>
      <div style={{
        display:"flex", flexDirection:"row", overflow:"hidden",
        fontFamily:'"Helvetica Neue LT Std 97 Black Condensed",Helvetica,Arial,sans-serif',
        fontSize:"clamp(4rem,10vw,9rem)", fontWeight:900, color:"#fff",
        letterSpacing:"-0.04em", lineHeight:1,
      }}>
        {MUSI_CHARS.map((ch,i) => {
          const dur   = Math.round(400 * LETTER_SPEED[i]);
          const delay = LETTER_ORDER[i] * 60;
          return (
            <span key={i} style={{
              display:"inline-block",
              transform: lettersVisible ? "translateY(0%)" : "translateY(110%)",
              opacity: lettersVisible ? 1 : 0,
              transition: lettersVisible
                ? `transform ${dur}ms cubic-bezier(0.16,1,0.3,1) ${delay}ms, opacity ${Math.round(dur*0.5)}ms ease ${delay}ms`
                : "none",
            }}>{ch}</span>
          );
        })}
      </div>
    </div>
  );
}

// ─── NAVBAR ────────────────────────────────────────────────────────────────────
function ThemeSpheres({ theme, onSelectTheme }: { theme:Theme; onSelectTheme:(t:Theme)=>void }) {
  const CFG = {
    white:{ sz:20, bg:"#fff",    border:"#bbb" },
    black:{ sz:28, bg:"#171717", border:"#fff" },
    green:{ sz:20, bg:"#166534", border:"#166534" },
  } as const;
  return (
    <div className="flex items-center gap-2">
      {(["white","black","green"] as const).map(name => {
        const {sz,bg,border} = CFG[name];
        const ring = sz+12;
        return (
          <button key={name} type="button" aria-label={`${name} mode`}
            onClick={() => onSelectTheme(THEMES[name])}
            className="relative focus:outline-none"
            style={{ background:"none", border:"none", padding:0 }}>
            <span style={{ width:sz, height:sz, borderRadius:"50%", background:bg,
              border:`${name==="black"?2:1}px solid ${border}`,
              display:"inline-block", boxShadow:"0 1px 4px rgba(0,0,0,0.18)" }} />
            {theme.name===name && (
              <span className="absolute" style={{
                top:-(ring-sz)/2, left:-(ring-sz)/2, width:ring, height:ring,
                borderRadius:"50%", border:`${name==="black"?3:2.5}px solid ${border}`,
                pointerEvents:"none", zIndex:2,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

function NavBar({ theme, onSelectTheme }: { theme:Theme; onSelectTheme:(t:Theme)=>void }) {
  return (
    <div className="fixed top-6 right-8 flex flex-col items-end gap-2 z-30" style={{ pointerEvents:"auto" }}>
      <ThemeSpheres theme={theme} onSelectTheme={onSelectTheme} />
      <div className="flex gap-8 mt-4">
        {[{href:"/shop",label:"Shop"},{href:"/bag",label:"Bag"}].map(({href,label}) => (
          <TransitionLink key={label} href={href}
            className={`underline-anim-btn text-3xl font-serif relative px-2 focus:outline-none group ${theme.nav}`}>
            {label}
            <span className={`underline-anim${label==="Shop"?" active":""}`} />
          </TransitionLink>
        ))}
      </div>
    </div>
  );
}

// ─── FOOTER ────────────────────────────────────────────────────────────────────
function Footer({ theme }: { theme:Theme }) {
  const FF = '"Helvetica Neue LT Std 97 Black Condensed",Helvetica,Arial,sans-serif';
  return (
    <footer style={{ width:"100%", padding:"clamp(48px,8vh,96px) clamp(16px,3vw,48px) clamp(32px,6vh,64px)", color:theme.text }}>
      <div style={{ width:"100%", height:16, background:theme.text, borderRadius:999, opacity:0.9 }} />
      <div style={{ display:"flex", flexDirection:"row", alignItems:"flex-end", justifyContent:"space-between",
        marginTop:"clamp(32px,5vw,64px)", marginBottom:"clamp(32px,5vw,64px)", gap:16 }}>
        <p style={{ fontFamily:FF, fontSize:"clamp(1.4rem,3.2vw,3.4rem)", fontWeight:900, lineHeight:1,
          textTransform:"uppercase", letterSpacing:"-0.03em", maxWidth:"60%" }}>
          Most original tough<br/>leather you will get.<br/>Wear with pride.
        </p>
        <div style={{ display:"flex", alignItems:"center", gap:6, fontFamily:FF,
          fontSize:"clamp(2rem,5vw,5rem)", fontWeight:900, lineHeight:1, opacity:0.9 }}>
          <span style={{ fontSize:"0.7em" }}>©</span>
          <span style={{ fontSize:"clamp(1.4rem,3.2vw,3.4rem)", fontWeight:900 }}>2026</span>
        </div>
      </div>
      <div style={{ width:"100%", height:1.5, background:theme.text, opacity:0.35, marginBottom:16 }} />
      <div style={{ display:"flex", flexDirection:"row", alignItems:"flex-start", justifyContent:"space-between", gap:24 }}>
        <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
          <div style={{ display:"flex", flexDirection:"row", alignItems:"baseline", gap:32, flexWrap:"wrap" }}>
            <span style={{ fontFamily:FF, fontWeight:900, textTransform:"uppercase", fontSize:"0.8rem", letterSpacing:"0.04em", whiteSpace:"nowrap" }}>Musi&apos;s Collection</span>
            <span style={{ fontSize:"0.8rem", opacity:0.75, whiteSpace:"nowrap" }}>Mombasa</span>
            <button className="underline-anim-btn group relative"
              style={{ fontSize:"0.8rem", opacity:0.85, background:"none", border:"none", cursor:"pointer", color:theme.text, padding:0, whiteSpace:"nowrap" }}>
              We value your privacy — read our promise<span className="underline-anim" />
            </button>
          </div>
          <div style={{ display:"flex", flexDirection:"row", alignItems:"baseline", gap:32, flexWrap:"wrap", marginTop:4 }}>
            <span style={{ fontSize:"0.8rem", opacity:0.75, whiteSpace:"nowrap" }}>All rights reserved © 2026</span>
            <span style={{ fontSize:"0.8rem", opacity:0.75, whiteSpace:"nowrap" }}>Likoni.</span>
          </div>
        </div>
        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:8, flexShrink:0 }}>
          {[
            { label:"Instagram",                 href:"https://instagram.com" },
            { label:"Facebook",                  href:"https://facebook.com" },
            { label:"WhatsApp",                  href:"https://wa.me" },
            { label:"See who made the website.", href:"#", italic:true },
          ].map(({label,href,italic}) => (
            <a key={label} href={href} target="_blank" rel="noopener noreferrer"
              className="underline-anim-btn group relative"
              style={{ color:theme.text, textDecoration:"none", fontSize:"0.8rem",
                opacity:italic?0.6:0.85, fontStyle:italic?"italic":"normal" }}>
              {label}<span className="underline-anim" />
            </a>
          ))}
        </div>
      </div>
    </footer>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────────
export default function ProductPage() {
  const params  = useParams<{ id:string }>();
  const product = ALL_PRODUCTS.find(p => p.id === params.id) ?? ALL_PRODUCTS[0];

  const [loading,     setLoading]     = useState(true);
  const [revealed,    setRevealed]    = useState(false);
  const [theme,       setTheme]       = useState<Theme>(THEMES.green);
  const [qty,         setQty]         = useState(1);

  const cursorRef = useRef<HTMLDivElement>(null);
  const isClient  = useSyncExternalStore(() => () => {}, () => true, () => false);
  const FF = '"Helvetica Neue LT Std 97 Black Condensed",Helvetica,Arial,sans-serif';

  // Same momentum scroll as landing page
  useVirtualScroll(0.09);

  // Theme → body
  useEffect(() => {
    if (!isClient) return;
    document.body.style.background = theme.bg;
    document.body.style.color      = theme.text;
  }, [theme, isClient]);

  // Cursor
  useEffect(() => {
    if (!isClient || isMobile()) return;
    document.body.style.cursor = "none";
    const move = (e:MouseEvent) => {
      if (cursorRef.current) {
        cursorRef.current.style.left = e.clientX + "px";
        cursorRef.current.style.top  = e.clientY + "px";
      }
    };
    document.addEventListener("mousemove", move, { capture:true });
    return () => { document.body.style.cursor = ""; document.removeEventListener("mousemove", move, { capture:true }); };
  }, [isClient]);

  const handleCurtainStart = useCallback(() => {
    setTimeout(() => setRevealed(true), 80);
  }, []);

  // ── Layout explanation ────────────────────────────────────────────────────
  //
  //  Outer wrapper:  #vs-wrapper (momentum scroll target, same as landing page)
  //
  //  ┌──────────────────────────────────────────────────────┐
  //  │  .page-body  (position: relative)                    │
  //  │                                                      │
  //  │  ┌────────────────────┬─────────────────────────┐   │
  //  │  │  .left-col         │  .right-col              │   │
  //  │  │  position:sticky   │  position:sticky         │   │
  //  │  │  top:0             │  top:0                   │   │
  //  │  │  height: 200vw     │  height: 100vh           │   │
  //  │  │  (2 images)        │  (product detail only)   │   │
  //  │  │                    │                          │   │
  //  │  │  img1 (100vw tall) │  Return to shop          │   │
  //  │  │  img2 (100vw tall) │  Title                   │   │
  //  │  │                    │  Price / desc / qty       │   │
  //  │  │                    │  Add to Bag               │   │
  //  │  └────────────────────┴─────────────────────────┘   │
  //  │                                                      │
  //  │  .footer-row  (full width, after the columns)        │
  //  └──────────────────────────────────────────────────────┘
  //
  //  The .two-col-row has a height equal to the left column (200vw).
  //  The right col is sticky top:0 height:100vh — it sticks for the first
  //  100vh of scroll then exits normally (disappears as page scrolls past it).
  //  The left col is sticky top:0 — it keeps scrolling images into view for
  //  the full 200vw - 100vh of scroll distance, then the footer appears.
  //
  //  On scroll UP from footer: left images re-enter, then right re-appears
  //  as the user scrolls back into the top 100vh zone. This matches exactly
  //  what hellohello does.

  return (
    <>
      {loading && (
        <ProductLoadingScreen onCurtainStart={handleCurtainStart} onDone={() => setLoading(false)} />
      )}

      {/* ── MOMENTUM SCROLL WRAPPER (same id as landing page) ── */}
      <div id="vs-wrapper" style={{ background:theme.bg, color:theme.text, fontFamily:FF, position:"relative" }}>

        {/* ── TWO-COLUMN SECTION ──
            Height = left col height = 2 images = 200vw.
            This gives the page enough scroll distance for the left images
            to fully travel through the viewport.
        ── */}
        <div style={{
          position:"relative",
          display:"flex",
          flexDirection:"row",
          alignItems:"flex-start",
        }}>

          {/* ══ LEFT COLUMN ══
              Normal document flow — two images stacked vertically.
              The right column being sticky creates the "right stays put" effect.
              paddingTop matches the right panel so image 1 top aligns with Return to Shop.
          ══ */}
          <div style={{
            width:"50%",
            flexShrink:0,
            paddingTop:"clamp(48px,8vh,96px)",
            boxSizing:"border-box",
          }}>
            <LeftImages src={product.src} fill={product.fill} name={product.name} />
          </div>

          {/* ══ RIGHT COLUMN ══
              sticky top:0, height:100vh.
              Sticks during the first viewport-height of scroll.
              Once the page scroll exceeds 100vh, this col exits sticky
              and the left images continue scrolling alone.
              On scroll-up from footer, right re-appears first (sticky re-engages).
          ══ */}
          <div style={{
            width:"50%",
            flexShrink:0,
            position:"sticky",
            top:0,
            height:"100vh",
            display:"flex",
            flexDirection:"column",
            justifyContent:"flex-start",
            paddingLeft:"clamp(28px,4vw,64px)",
            paddingRight:"clamp(16px,3vw,48px)",
            paddingTop:"clamp(48px,8vh,96px)",
            boxSizing:"border-box",
            overflow:"hidden",
            alignSelf:"flex-start",
          }}>

            {/* Back to home */}
            <div style={{
              display:"flex", alignItems:"center", gap:8,
              marginBottom:"clamp(24px,4vh,52px)",
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateX(0)" : "translateX(-14px)",
              transition: revealed ? "opacity 480ms ease 120ms, transform 480ms cubic-bezier(0.16,1,0.3,1) 120ms" : "none",
            }}>
              <TransitionLink href="/" style={{
                display:"flex", alignItems:"center", gap:8,
                background:"none", border:"none", cursor:"pointer",
                color:theme.text, padding:0, fontFamily:FF,
                fontSize:"clamp(0.8rem,1.1vw,1rem)",
                letterSpacing:"0.05em", textTransform:"uppercase", fontWeight:700,
              }}>
                <svg width="20" height="16" viewBox="0 0 22 18" fill="none">
                  <path d="M21 9H1M1 9L9 1M1 9L9 17" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Home
              </TransitionLink>
            </div>

            {/* Product name */}
            <h1 style={{
              fontFamily:FF,
              fontSize:"clamp(3rem,6vw,6.5rem)",
              fontWeight:900, lineHeight:0.95,
              letterSpacing:"-0.03em", color:theme.text,
              textTransform:"uppercase",
              marginBottom:"clamp(10px,2vh,22px)",
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(22px)",
              transition: revealed ? "opacity 520ms ease 200ms, transform 520ms cubic-bezier(0.16,1,0.3,1) 200ms" : "none",
            }}>
              {product.name}
            </h1>

            {/* Price */}
            <p style={{
              fontFamily:FF,
              fontSize:"clamp(1.2rem,2vw,2rem)",
              fontWeight:900, letterSpacing:"-0.02em", color:theme.text,
              marginBottom:"clamp(10px,1.6vh,18px)",
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(18px)",
              transition: revealed ? "opacity 520ms ease 280ms, transform 520ms cubic-bezier(0.16,1,0.3,1) 280ms" : "none",
            }}>
              ${product.price}
            </p>

            {/* Description */}
            <p style={{
              fontFamily:"Helvetica,Arial,sans-serif",
              fontSize:"clamp(0.8rem,1.1vw,1rem)",
              fontWeight:400, lineHeight:1.65, color:theme.text,
              opacity: revealed ? 0.78 : 0,
              marginBottom:"clamp(18px,3vh,36px)", maxWidth:"36ch",
              transform: revealed ? "translateY(0)" : "translateY(18px)",
              transition: revealed ? "opacity 520ms ease 360ms, transform 520ms cubic-bezier(0.16,1,0.3,1) 360ms" : "none",
            }}>
              {product.description}
            </p>

            {/* Qty counter */}
            <div style={{
              display:"flex", alignItems:"center",
              gap:"clamp(12px,1.6vw,20px)",
              marginBottom:"clamp(18px,3vh,36px)",
              opacity: revealed ? 1 : 0,
              transform: revealed ? "translateY(0)" : "translateY(14px)",
              transition: revealed ? "opacity 520ms ease 440ms, transform 520ms cubic-bezier(0.16,1,0.3,1) 440ms" : "none",
            }}>
              <button onClick={() => setQty(q => Math.max(1,q-1))} aria-label="Decrease"
                style={{ fontFamily:FF, fontSize:"clamp(1.2rem,2vw,2rem)", fontWeight:900,
                  background:"none", border:"none", cursor:"pointer", color:theme.text,
                  lineHeight:1, padding:"0 4px", userSelect:"none",
                  opacity:qty<=1?0.25:1, transition:"opacity 0.2s" }}>
                −
              </button>
              <span style={{ fontFamily:FF, fontSize:"clamp(1.2rem,2vw,2rem)", fontWeight:900,
                color:theme.text, minWidth:"2ch", textAlign:"center",
                letterSpacing:"-0.02em", lineHeight:1 }}>
                {qty}
              </span>
              <button onClick={() => setQty(q => q+1)} aria-label="Increase"
                style={{ fontFamily:FF, fontSize:"clamp(1.2rem,2vw,2rem)", fontWeight:900,
                  background:"none", border:"none", cursor:"pointer", color:theme.text,
                  lineHeight:1, padding:"0 4px", userSelect:"none" }}>
                +
              </button>
            </div>

            {/* Thin divider */}
            <div style={{
              width:"100%", height:1.5, background:theme.text,
              opacity: revealed ? 0.22 : 0,
              marginBottom:"clamp(14px,2.2vh,24px)",
              transition: revealed ? "opacity 400ms ease 500ms" : "none",
            }} />

            {/* Stock / Add to Bag */}
            {product.inStock ? (
              <AddToBagButton theme={theme} revealed={revealed} />
            ) : (
              <span style={{
                fontFamily:FF, fontSize:"clamp(0.95rem,1.6vw,1.5rem)",
                fontWeight:900, textTransform:"uppercase", letterSpacing:"-0.01em",
                color:theme.text, opacity: revealed ? 0.45 : 0,
                textDecoration:"line-through", display:"block", width:"100%",
                transition: revealed ? "opacity 520ms ease 560ms" : "none",
              }}>
                Sold Out
              </span>
            )}
          </div>
          {/* end right col */}

        </div>
        {/* end two-col row */}

        {/* ── FOOTER — full width, in normal document flow below the two columns ── */}
        <Footer theme={theme} />

      </div>
      {/* end vs-wrapper */}

      {/* ── Portals ── */}
      {isClient && createPortal(
        <>
          <TransitionLink href="/" className="fixed top-2 left-2 z-30" aria-label="Home" style={{ pointerEvents:"auto" }}>
            <Image src="/favicon.ico" alt="Logo" width={160} height={100} priority />
          </TransitionLink>
          <NavBar theme={theme} onSelectTheme={(nextTheme) => setTheme(nextTheme)} />
        </>,
        document.body,
      )}

      {isClient && !isMobile() && createPortal(
        <>
          <div ref={cursorRef} aria-hidden style={{
            pointerEvents:"none", position:"fixed", zIndex:99999,
            left:0, top:0, width:14, height:14, borderRadius:"50%",
            background:"#16a34a", transform:"translate(-50%,-50%)",
            boxShadow:"0 0 10px 2px #16a34a88", opacity:0.92,
          }} />
          <style>{`* { cursor: none !important; }`}</style>
        </>,
        document.body,
      )}

      <style jsx global>{`
        .underline-anim-btn {
          background: none; border: none; cursor: pointer;
          position: relative; padding-bottom: 0.2em;
        }
        .underline-anim {
          display: block; position: absolute;
          left: 0; bottom: -2px; height: 4px; width: 100%;
          background: ${theme.accent};
          border-radius: 2px; transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.35s cubic-bezier(0.77,0,0.175,1);
          z-index: 1;
        }
        .underline-anim-btn:hover .underline-anim,
        .underline-anim-btn:focus .underline-anim { transform: scaleX(1); }
        .underline-anim-btn .underline-anim.active { transform: scaleX(1); }
      `}</style>
    </>
  );
}

// ─── LEFT IMAGES — two plain stacked images, no scroll magic ─────────────────
// Image 1 (src)  — raw product shot, no animation, no hover effect.
// Image 2 (fill) — the fill/flow image used in the landing page hover animation.
//                  Sits directly below image 1 in normal document flow.
// The right panel sticky behaviour handles the "static right while left scrolls" effect.
function LeftImages({ src, fill, name }: { src:string; fill:string; name:string }) {
  const IMG_H = "75vw";
  return (
    <div style={{ width:"100%", display:"flex", flexDirection:"column" }}>
      {/* IMAGE 1 — raw product image, no effects */}
      <div style={{ width:"100%", height:IMG_H, overflow:"hidden" }}>
        <img src={src} alt={name}
          style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center center", display:"block" }} />
      </div>
      {/* IMAGE 2 — fill/flow image */}
      <div style={{ width:"100%", height:IMG_H, overflow:"hidden" }}>
        <img src={fill} alt=""
          style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center center", display:"block" }} />
      </div>
    </div>
  );
}

// ─── DEAD CODE STUB — kept so TypeScript doesn't error on removed component ───
function LeftImagesScroller({
  src, fill, name, fillMounted, imgHovering, onMouseEnter, onMouseLeave, IMG_H
}: {
  src:string; fill:string; name:string;
  fillMounted:boolean; imgHovering:boolean;
  onMouseEnter:()=>void; onMouseLeave:()=>void;
  IMG_H:string;
}) {
  const innerRef   = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => {
      if (!innerRef.current) return;

      // The sticky left column pins at top:0.
      // The two-col row starts at the top of the page (scrollY ≈ 0).
      // We want: at scrollY=0 → translateY=0 (image 1 at top, within padded area)
      // As user scrolls, we translate up so image 2 slides into view.
      // The translate travel distance = one image height in px = 75vw = 0.75 * vw.
      const imgHeightPx = window.innerWidth * 0.75;

      // Clamp so we stop exactly when image 2's bottom aligns with viewport bottom.
      // That moment is when scrollY = two-col-row height - viewport height
      //   = 150vw - 100vh = 1.5*vw - vh
      // We also offset by the paddingTop so the translate feels natural.
      const paddingTop = Math.min(96, Math.max(48, window.innerHeight * 0.08));

      // Scroll range: from 0 to (imgHeightPx - paddingTop), clamped
      const maxTranslate = imgHeightPx - paddingTop;
      const y = Math.min(Math.max(window.scrollY, 0), maxTranslate);
      innerRef.current.style.transform = `translateY(-${y}px)`;
    };
    window.addEventListener("scroll", onScroll, { passive:true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    // Inner tall div — will be translated up as page scrolls
    <div ref={innerRef} style={{ willChange:"transform" }}>
      {/* IMAGE 1 — product */}
      <div
        style={{ width:"100%", height:IMG_H, position:"relative", overflow:"hidden" }}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <img src={src} alt={name}
          style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center center", display:"block" }} />
        {/* Hover fill overlay */}
        {fillMounted && (
          <div style={{
            position:"absolute", inset:0, background:"#166534",
            clipPath: imgHovering ? "inset(0 0% 0 0)" : "inset(0 100% 0 0)",
            transition:"clip-path 0.65s cubic-bezier(0.77,0,0.175,1)", zIndex:5,
          }}>
            <img src={fill} alt=""
              style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center center", display:"block" }} />
          </div>
        )}
      </div>

      {/* IMAGE 2 — fill/flow */}
      <div style={{ width:"100%", height:IMG_H, position:"relative", overflow:"hidden" }}>
        <img src={fill} alt=""
          style={{ width:"100%", height:"100%", objectFit:"cover", objectPosition:"center center", display:"block" }} />
      </div>
    </div>
  );
}

// ─── ADD TO BAG BUTTON ────────────────────────────────────────────────────────
function AddToBagButton({ theme, revealed }: { theme:Theme; revealed:boolean }) {
  const [hovered, setHovered] = useState(false);
  const FF = '"Helvetica Neue LT Std 97 Black Condensed",Helvetica,Arial,sans-serif';
  return (
    <button
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display:"inline-flex", alignItems:"center",
        background:"none", border:"none", cursor:"pointer", padding:0,
        color:theme.text, fontFamily:FF,
        fontSize:"clamp(0.95rem,1.6vw,1.5rem)",
        fontWeight:900, letterSpacing:"-0.01em", textTransform:"uppercase",
        width:"100%", overflow:"hidden",
        opacity: revealed ? 1 : 0,
        transform: revealed ? "translateY(0)" : "translateY(12px)",
        transition: revealed ? "opacity 520ms ease 560ms, transform 520ms cubic-bezier(0.16,1,0.3,1) 560ms" : "none",
      }}
    >
      <span style={{
        display:"flex", alignItems:"center", gap:12,
        transform: hovered ? "translateX(38px)" : "translateX(0)",
        transition:"transform 0.38s cubic-bezier(0.77,0,0.175,1)",
      }}>
        {/* Left arrow — appears on hover */}
        <span style={{
          display:"inline-flex", alignItems:"center",
          opacity: hovered ? 1 : 0,
          transition:"opacity 0.2s ease 0.1s",
          marginLeft:-38,
        }}>
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" style={{ transform:"rotate(210deg)" }}>
            <path d="M4 18L18 4M18 4H7M18 4V15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span>Add to Bag</span>
        {/* Right arrow — hides on hover */}
        <span style={{
          display:"inline-flex", alignItems:"center",
          opacity: hovered ? 0 : 1,
          transition:"opacity 0.15s ease",
        }}>
          <svg width="20" height="20" viewBox="0 0 22 22" fill="none" style={{ transform:"rotate(30deg)" }}>
            <path d="M4 18L18 4M18 4H7M18 4V15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </span>
    </button>
  );
}