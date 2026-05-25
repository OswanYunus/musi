"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import { TransitionLink } from "@/components/RouteTransition";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { useBag } from "@/hooks/useBag";

/* ─── THEME ─────────────────────────────────────────────────────────────────── */
const THEMES = {
  green: { bg: "#c4af9d", text: "#166534", nav: "text-green-800", accent: "#16a34a", name: "green" },
  black: { bg: "#171717", text: "#ffffff",  nav: "text-white",     accent: "#ffffff", name: "black" },
  white: { bg: "#ffffff", text: "#171717",  nav: "text-black",     accent: "#171717", name: "white" },
} as const;
type Theme = (typeof THEMES)[keyof typeof THEMES];
const FF = '"Helvetica Neue LT Std 97 Black Condensed", Helvetica, Arial, sans-serif';

const createOrderRef = () => `Musi-${Date.now().toString().slice(-6)}`;

/* ─── THEME SPHERES ─────────────────────────────────────────────────────────── */
function ThemeSpheres({ theme, onSelectTheme }: { theme: Theme; onSelectTheme: (t: Theme) => void }) {
  const CFG = {
    white: { sz: 20, bg: "#fff",    border: "#bbb" },
    black: { sz: 28, bg: "#171717", border: "#fff" },
    green: { sz: 20, bg: "#166534", border: "#166534" },
  } as const;
  return (
    <div className="flex items-center gap-2">
      {(["white", "black", "green"] as const).map(name => {
        const { sz, bg, border } = CFG[name];
        const ring = sz + 12;
        return (
          <button key={name} type="button" aria-label={`${name} mode`}
            onClick={() => onSelectTheme(THEMES[name])}
            className="relative focus:outline-none"
            style={{ background: "none", border: "none", padding: 0 }}>
            <span style={{
              width: sz, height: sz, borderRadius: "50%", background: bg,
              border: `${name === "black" ? 2 : 1}px solid ${border}`,
              display: "inline-block", boxShadow: "0 1px 4px rgba(0,0,0,0.18)",
            }} />
            {theme.name === name && (
              <span className="absolute" style={{
                top: -(ring - sz) / 2, left: -(ring - sz) / 2,
                width: ring, height: ring, borderRadius: "50%",
                border: `${name === "black" ? 3 : 2.5}px solid ${border}`,
                pointerEvents: "none", zIndex: 2,
              }} />
            )}
          </button>
        );
      })}
    </div>
  );
}

/* ─── NAVBAR ────────────────────────────────────────────────────────────────── */
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
                  background: "#16a34a", color: "#fff", borderRadius: "999px",
                  minWidth: "1.35rem", height: "1.35rem",
                  fontSize: "0.7rem", fontWeight: 900,
                  padding: "0 0.3rem", lineHeight: 1,
                  boxShadow: "0 2px 8px rgba(22,163,74,0.45)",
                  transform: "translateY(-0.5rem)",
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

/* ─── EMPTY STATE ───────────────────────────────────────────────────────────── */
function EmptyBag({ theme, visible }: { theme: Theme; visible: boolean }) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      minHeight: "60vh", gap: "2rem", textAlign: "center",
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(32px)",
      transition: "opacity 0.6s ease 0.2s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.2s",
    }}>
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" style={{ opacity: 0.35, color: theme.text }}>
        <rect x="12" y="28" width="56" height="44" rx="6" stroke="currentColor" strokeWidth="3"/>
        <path d="M26 28V22a14 14 0 0 1 28 0v6" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <circle cx="40" cy="50" r="4" fill="currentColor" opacity="0.5"/>
      </svg>
      <div>
        <p style={{
          fontFamily: FF, fontSize: "clamp(2rem,5vw,4rem)", fontWeight: 900,
          textTransform: "uppercase", color: theme.text, letterSpacing: "-0.03em",
          lineHeight: 1, marginBottom: "0.75rem",
        }}>Your bag is empty.</p>
        <p style={{
          fontFamily: "Helvetica, Arial, sans-serif", fontSize: "clamp(0.85rem,1.2vw,1rem)",
          color: theme.text, opacity: 0.6, lineHeight: 1.6, maxWidth: "28ch", margin: "0 auto",
        }}>Nothing here yet. Head to the shop and find something worth owning.</p>
      </div>
      <TransitionLink href="/shop" style={{
        display: "inline-flex", alignItems: "center", gap: 10,
        background: "#16a34a", color: "#fff", fontFamily: FF, fontWeight: 900,
        fontSize: "clamp(0.9rem,1.4vw,1.1rem)", textTransform: "uppercase",
        letterSpacing: "0.04em", padding: "0.9rem 2.2rem", borderRadius: "999px",
        textDecoration: "none", boxShadow: "0 6px 24px rgba(22,163,74,0.35)",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 10px 32px rgba(22,163,74,0.45)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.transform = ""; (e.currentTarget as HTMLAnchorElement).style.boxShadow = "0 6px 24px rgba(22,163,74,0.35)"; }}
      >
        Shop now
        <svg width="16" height="16" viewBox="0 0 22 22" fill="none" style={{ transform: "rotate(30deg)" }}>
          <path d="M4 18L18 4M18 4H7M18 4V15" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </TransitionLink>
    </div>
  );
}

/* ─── BAG ITEM ROW ──────────────────────────────────────────────────────────── */
function BagRow({ item, theme, index, visible, onRemove, onQtyChange }: {
  item: { id: string; name: string; price: number; src: string; qty: number };
  theme: Theme; index: number; visible: boolean;
  onRemove: (id: string) => void; onQtyChange: (id: string, qty: number) => void;
}) {
  const [removing, setRemoving] = useState(false);
  const handleRemove = () => { setRemoving(true); setTimeout(() => onRemove(item.id), 380); };

  return (
    <div style={{
      display: "flex", alignItems: "center", gap: "clamp(1rem,2vw,2rem)",
      padding: "clamp(1rem,2vh,1.5rem) 0", borderBottom: `1px solid ${theme.text}22`,
      opacity: visible && !removing ? 1 : 0,
      transform: visible && !removing ? "translateX(0)" : removing ? "translateX(40px)" : "translateX(-24px)",
      transition: removing
        ? "opacity 0.35s ease, transform 0.35s cubic-bezier(0.4,0,1,1)"
        : `opacity 0.5s ease ${index * 80}ms, transform 0.5s cubic-bezier(0.16,1,0.3,1) ${index * 80}ms`,
    }}>
      <div style={{
        width: "clamp(64px,10vw,96px)", height: "clamp(64px,10vw,96px)",
        flexShrink: 0, borderRadius: "1rem", background: "#f5e8d4",
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", boxShadow: "0 4px 16px rgba(80,45,15,0.12)",
        position: "relative",
      }}>
        <Image src={item.src} alt={item.name} fill style={{ objectFit: "contain" }} sizes="96px" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontFamily: FF, fontWeight: 900, fontSize: "clamp(1rem,1.8vw,1.4rem)",
          color: theme.text, textTransform: "uppercase", letterSpacing: "-0.02em",
          lineHeight: 1.1, marginBottom: "0.25rem",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
        }}>{item.name}</p>
        <p style={{ fontFamily: FF, fontWeight: 900, fontSize: "clamp(0.85rem,1.3vw,1.1rem)", color: "#16a34a" }}>
          Ksh {(item.price * item.qty).toLocaleString()}
        </p>
        {item.qty > 1 && (
          <p style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.72rem", color: theme.text, opacity: 0.5, marginTop: "0.15rem" }}>
            Ksh {item.price.toLocaleString()} each
          </p>
        )}
      </div>
      <div style={{
        display: "inline-flex", alignItems: "center",
        border: `1.5px solid ${theme.text}33`, borderRadius: "999px", overflow: "hidden",
        background: theme.name === "black" ? "rgba(255,255,255,0.06)" : "#fff8f0", flexShrink: 0,
      }}>
        <button onClick={() => onQtyChange(item.id, item.qty - 1)} style={{
          width: "2.2rem", height: "2.2rem", background: "none", border: "none",
          fontSize: "1.2rem", fontWeight: 900, color: theme.text,
          cursor: item.qty <= 1 ? "not-allowed" : "pointer", opacity: item.qty <= 1 ? 0.25 : 1,
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>−</button>
        <span style={{ minWidth: "1.8rem", textAlign: "center", fontFamily: FF, fontSize: "0.95rem", fontWeight: 900, color: theme.text }}>{item.qty}</span>
        <button onClick={() => onQtyChange(item.id, item.qty + 1)} style={{
          width: "2.2rem", height: "2.2rem", background: "none", border: "none",
          fontSize: "1.2rem", fontWeight: 900, color: theme.text, cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
        }}>+</button>
      </div>
      <button onClick={handleRemove} aria-label="Remove item" style={{
        background: "none", border: "none", cursor: "pointer",
        color: theme.text, opacity: 0.35, padding: "0.4rem", flexShrink: 0, borderRadius: "50%",
        transition: "opacity 0.2s, transform 0.2s",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "1"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.15)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.opacity = "0.35"; (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

/* ─── ORDER SUMMARY PANEL ───────────────────────────────────────────────────── */
function OrderSummary({ theme, totalPrice, itemCount, visible, onCheckout }: {
  theme: Theme; totalPrice: number; itemCount: number; visible: boolean; onCheckout: () => void;
}) {
  const shipping = totalPrice >= 5000 ? 0 : 350;
  const grand = totalPrice + shipping;
  return (
    <div style={{
      background: theme.name === "black" ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.55)",
      backdropFilter: "blur(12px)", borderRadius: "2rem",
      padding: "clamp(1.5rem,3vw,2.5rem)", border: `1px solid ${theme.text}18`,
      boxShadow: "0 8px 40px rgba(0,0,0,0.08)", position: "sticky", top: "7rem",
      opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(24px)",
      transition: "opacity 0.6s ease 0.35s, transform 0.6s cubic-bezier(0.16,1,0.3,1) 0.35s",
    }}>
      <p style={{ fontFamily: FF, fontWeight: 900, fontSize: "clamp(1.2rem,2vw,1.6rem)", color: theme.text, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "1.5rem" }}>
        Order Summary
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.5rem" }}>
        {[
          { label: `Items (${itemCount})`, value: `Ksh ${totalPrice.toLocaleString()}` },
          { label: "Shipping", value: shipping === 0 ? "Free" : `Ksh ${shipping.toLocaleString()}`, green: shipping === 0 },
        ].map(({ label, value, green }) => (
          <div key={label} style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
            <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.85rem", color: theme.text, opacity: 0.65 }}>{label}</span>
            <span style={{ fontFamily: FF, fontWeight: 900, fontSize: "clamp(0.85rem,1.2vw,1rem)", color: green ? "#16a34a" : theme.text }}>{value}</span>
          </div>
        ))}
      </div>
      <div style={{ width: "100%", height: 1, background: theme.text, opacity: 0.15, marginBottom: "1.25rem" }} />
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.35rem" }}>
        <span style={{ fontFamily: FF, fontWeight: 900, fontSize: "clamp(1rem,1.6vw,1.25rem)", color: theme.text, textTransform: "uppercase" }}>Total</span>
        <span style={{ fontFamily: FF, fontWeight: 900, fontSize: "clamp(1.2rem,2vw,1.6rem)", color: "#16a34a" }}>Ksh {grand.toLocaleString()}</span>
      </div>
      <p style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.72rem", color: "#16a34a", marginBottom: "1.5rem" }}>
        {shipping === 0 ? "✓ Free shipping applied" : `Add Ksh ${(5000 - totalPrice).toLocaleString()} more for free shipping`}
      </p>
      <button onClick={onCheckout} style={{
        width: "100%", padding: "1rem 1.5rem", background: "#16a34a", color: "#fff",
        border: "none", borderRadius: "999px", cursor: "pointer", fontFamily: FF,
        fontWeight: 900, fontSize: "clamp(0.9rem,1.3vw,1.1rem)",
        textTransform: "uppercase", letterSpacing: "0.04em",
        boxShadow: "0 6px 24px rgba(22,163,74,0.38)", transition: "transform 0.2s ease, box-shadow 0.2s ease", marginBottom: "1rem",
      }}
        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-2px)"; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 10px 32px rgba(22,163,74,0.48)"; }}
        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = ""; (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 6px 24px rgba(22,163,74,0.38)"; }}
      >
        Proceed to Checkout
      </button>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", opacity: 0.5 }}>
        {["M-Pesa", "PayPal", "Card"].map(m => (
          <span key={m} style={{
            fontFamily: FF, fontWeight: 900, fontSize: "0.62rem", color: theme.text,
            letterSpacing: "0.05em", textTransform: "uppercase",
            border: `1px solid ${theme.text}44`, borderRadius: "4px", padding: "2px 6px",
          }}>{m}</span>
        ))}
      </div>
    </div>
  );
}

/* ─── FIELD ─────────────────────────────────────────────────────────────────── */
function Field({ label, type = "text", value, onChange, placeholder, theme, error, prefix }: {
  label: string; type?: string; value: string; onChange: (v: string) => void;
  placeholder: string; theme: Theme; error?: string; prefix?: string;
}) {
  const [focused, setFocused] = useState(false);
  const borderColor = error ? "#ef4444" : focused ? "#16a34a" : `${theme.text}33`;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
      <label style={{
        fontFamily: FF, fontWeight: 900, fontSize: "0.72rem",
        color: theme.text, textTransform: "uppercase", letterSpacing: "0.06em", opacity: 0.7,
      }}>{label}</label>
      <div style={{
        display: "flex", alignItems: "center",
        border: `1.5px solid ${borderColor}`,
        borderRadius: "0.85rem", overflow: "hidden",
        background: theme.name === "black" ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.7)",
        transition: "border-color 0.2s ease",
      }}>
        {prefix && (
          <span style={{
            padding: "0.85rem 0 0.85rem 1rem",
            fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.9rem",
            color: theme.text, opacity: 0.5, userSelect: "none", flexShrink: 0,
          }}>{prefix}</span>
        )}
        <input
          type={type} value={value}
          onChange={e => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          style={{
            flex: 1, padding: prefix ? "0.85rem 1rem 0.85rem 0.35rem" : "0.85rem 1rem",
            background: "none", border: "none", outline: "none",
            fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.95rem",
            color: theme.text, width: "100%",
          }}
        />
      </div>
      {error && (
        <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.72rem", color: "#ef4444" }}>{error}</span>
      )}
    </div>
  );
}

/* ─── CHECKOUT MODAL ────────────────────────────────────────────────────────── */
// ── PASTE THIS TO REPLACE YOUR CheckoutModal COMPONENT in page.tsx ──────────
// Lines to replace: from `/* ─── CHECKOUT MODAL */` down to the closing `}` of CheckoutModal

/* ─── CHECKOUT MODAL ────────────────────────────────────────────────────────── */
type CheckoutStep = "details" | "payment" | "mpesa_waiting" | "sent" | "error";

function CheckoutModal({ theme, items, totalPrice, onClose, onSuccess }: {
  theme: Theme;
  items: { id: string; name: string; price: number; qty: number }[];
  totalPrice: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState<CheckoutStep>("details");
  const [sending, setSending] = useState(false);
  const [mpesaError, setMpesaError] = useState("");

  // Form fields
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [errors, setErrors] = useState<{ name?: string; email?: string; phone?: string }>({});

  // For polling
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { const t = setTimeout(() => setVisible(true), 20); return () => clearTimeout(t); }, []);

  // Clean up polling on unmount
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!name.trim())                             e.name  = "Full name is required";
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Valid email is required";
    if (!phone.trim() || phone.replace(/\D/g,"").length < 9)         e.phone = "Valid phone number is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleDetailsNext = () => { if (validate()) setStep("payment"); };

  const shipping = totalPrice >= 5000 ? 0 : 350;
  const grand = totalPrice + shipping;

  // ── Send booking email (for non-M-Pesa methods) ──────────────────────────
  const sendBookingEmail = async (method: string) => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, method, items, totalPrice: grand, shipping }),
    });
    if (!res.ok) throw new Error("Email failed");
  };

  // ── Poll query endpoint ───────────────────────────────────────────────────
  const pollStatus = (checkoutRequestId: string) => {
    let attempts = 0;
    const MAX = 20; // ~60 seconds

    pollRef.current = setInterval(async () => {
      attempts++;
      try {
        const res  = await fetch("/api/mpesa/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ checkoutRequestId }),
        });
        const data = await res.json();

        if (data.pending) return; // still processing — keep polling

        clearInterval(pollRef.current!);

        if (data.ok) {
          // Payment confirmed → send booking email then show success
          try { await sendBookingEmail("mpesa"); } catch {}
          setStep("sent");
          setTimeout(() => { onSuccess(); onClose(); }, 3200);
        } else {
          // Cancelled / wrong PIN / timeout
          const code = String(data.resultCode ?? "");
          const msg =
            code === "1032" ? "Payment cancelled. Please try again." :
            code === "1037" ? "Request timed out. Please try again." :
            code === "2001" ? "Wrong PIN entered too many times." :
            data.resultDesc ?? "Payment failed. Please try again.";
          setMpesaError(msg);
          setStep("error");
        }
      } catch {
        // Network glitch — keep polling until max attempts
        if (attempts >= MAX) {
          clearInterval(pollRef.current!);
          setMpesaError("Could not confirm payment. Check your M-Pesa messages.");
          setStep("error");
        }
      }

      if (attempts >= MAX) {
        clearInterval(pollRef.current!);
        setMpesaError("Payment confirmation timed out. Check your M-Pesa messages.");
        setStep("error");
      }
    }, 3000);
  };

  // ── Main submit handler ───────────────────────────────────────────────────
  const handleSubmit = async (method: string) => {
    setSending(true);
    setMpesaError("");

    try {
      if (method === "mpesa") {
        // 1. Initiate STK push
        const res = await fetch("/api/mpesa/stkpush", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            phone,
            amount: grand,
            orderRef: createOrderRef(),
          }),
        });
        const data = await res.json();
        if (!data.ok) throw new Error(data.error ?? "STK push failed");

        // 2. Show waiting screen and start polling
        setStep("mpesa_waiting");
        pollStatus(data.checkoutRequestId);

      } else {
        // PayPal / Card — just send booking email (payment handled manually)
        await sendBookingEmail(method);
        setStep("sent");
        setTimeout(() => { onSuccess(); onClose(); }, 3200);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setMpesaError(msg);
      setStep("error");
    } finally {
      setSending(false);
    }
  };

  const panelBg = theme.name === "black" ? "#1c1c1c" : "#fffaf6";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 500,
      display: "flex", alignItems: "center", justifyContent: "center",
      background: "rgba(0,0,0,0.6)", backdropFilter: "blur(10px)",
      opacity: visible ? 1 : 0, transition: "opacity 0.3s ease",
      padding: "1rem",
    }} onClick={step === "sent" || step === "mpesa_waiting" ? undefined : onClose}>
      <div style={{
        background: panelBg, borderRadius: "2rem",
        padding: "clamp(1.75rem,4vw,3rem)",
        width: "min(94vw, 520px)",
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 32px 96px rgba(0,0,0,0.35)",
        transform: visible ? "scale(1) translateY(0)" : "scale(0.92) translateY(28px)",
        transition: "transform 0.45s cubic-bezier(0.16,1,0.3,1) 0.05s",
      }} onClick={e => e.stopPropagation()}>

        {/* ── STEP: DETAILS ── */}
        {step === "details" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
              <div>
                <p style={{ fontFamily: FF, fontWeight: 900, fontSize: "clamp(1.3rem,3vw,1.9rem)", color: theme.text, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  Your Details
                </p>
                <p style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.78rem", color: theme.text, opacity: 0.5, marginTop: "0.35rem" }}>
                    Step 1 of 2 — We&apos;ll send your booking confirmation here
                </p>
              </div>
              <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: theme.text, opacity: 0.4, padding: "0.25rem", flexShrink: 0 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Order mini-summary */}
            <div style={{
              background: theme.name === "black" ? "rgba(255,255,255,0.05)" : "rgba(22,163,74,0.07)",
              border: "1px solid #16a34a33", borderRadius: "1.1rem",
              padding: "1rem 1.25rem", marginBottom: "1.75rem",
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.8rem", color: theme.text, opacity: 0.6 }}>
                  {items.reduce((s, i) => s + i.qty, 0)} item{items.reduce((s, i) => s + i.qty, 0) !== 1 ? "s" : ""}
                </span>
                <span style={{ fontFamily: FF, fontWeight: 900, fontSize: "1rem", color: "#16a34a" }}>
                  Ksh {grand.toLocaleString()}
                </span>
              </div>
              <div style={{ marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.2rem" }}>
                {items.map(i => (
                  <span key={i.id} style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.72rem", color: theme.text, opacity: 0.55 }}>
                    {i.name} × {i.qty}
                  </span>
                ))}
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.1rem", marginBottom: "1.75rem" }}>
              <Field label="Full Name" value={name} onChange={setName} placeholder="e.g. Musi Wanjiku" theme={theme} error={errors.name} />
              <Field label="Email Address" type="email" value={email} onChange={setEmail} placeholder="you@example.com" theme={theme} error={errors.email} />
              <Field label="Phone Number" type="tel" value={phone} onChange={setPhone} placeholder="0712 345 678" theme={theme} error={errors.phone} prefix="+254" />
            </div>

            <button onClick={handleDetailsNext} style={{
              width: "100%", padding: "1rem 1.5rem",
              background: "#16a34a", color: "#fff", border: "none",
              borderRadius: "999px", cursor: "pointer", fontFamily: FF,
              fontWeight: 900, fontSize: "1rem", textTransform: "uppercase",
              letterSpacing: "0.04em", boxShadow: "0 6px 24px rgba(22,163,74,0.38)",
              transition: "transform 0.2s ease",
            }}
              onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
              onMouseLeave={e => (e.currentTarget.style.transform = "")}
            >
              Continue to Payment →
            </button>
          </>
        )}

        {/* ── STEP: PAYMENT ── */}
        {step === "payment" && (
          <>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem" }}>
              <div>
                <p style={{ fontFamily: FF, fontWeight: 900, fontSize: "clamp(1.3rem,3vw,1.9rem)", color: theme.text, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1 }}>
                  Pay With
                </p>
                <p style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.78rem", color: theme.text, opacity: 0.5, marginTop: "0.35rem" }}>
                  Step 2 of 2 — Choose how to pay
                </p>
              </div>
              <button onClick={() => setStep("details")} style={{ background: "none", border: "none", cursor: "pointer", color: theme.text, opacity: 0.4, padding: "0.25rem", flexShrink: 0, display: "flex", alignItems: "center", gap: "0.3rem" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M5 12l7-7M5 12l7 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.75rem" }}>Back</span>
              </button>
            </div>

            {/* Customer summary */}
            <div style={{
              background: theme.name === "black" ? "rgba(255,255,255,0.05)" : "rgba(22,163,74,0.07)",
              border: "1px solid #16a34a33", borderRadius: "1.1rem",
              padding: "0.85rem 1.25rem", marginBottom: "1.5rem",
              display: "flex", flexDirection: "column", gap: "0.2rem",
            }}>
              {[{ label: "Name", value: name }, { label: "Email", value: email }, { label: "Phone", value: `+254 ${phone}` }].map(({ label, value }) => (
                <div key={label} style={{ display: "flex", gap: "0.5rem", alignItems: "baseline" }}>
                  <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.7rem", color: theme.text, opacity: 0.45, minWidth: "3.5rem" }}>{label}</span>
                  <span style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.82rem", color: theme.text, fontWeight: 600 }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Payment method buttons */}
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "1.5rem" }}>
              {[
                { id: "paylater", label: "Pay Later", desc: "We'll call you to arrange payment", color: "#7c3aed", icon: "✆" },
                { id: "mpesa",  label: "M-Pesa",              desc: "STK push to your Safaricom number", color: "#00a650", icon: "M" },
                { id: "paypal", label: "PayPal",              desc: "Pay with PayPal",                    color: "#003087", icon: "P" },
                { id: "card",   label: "Credit / Debit Card", desc: "Visa, Mastercard, etc.",             color: "#1a1a2e", icon: "C" },
              ].map(({ id, label, desc, color, icon }) => (
                <button key={id} disabled={sending} onClick={() => handleSubmit(id)} style={{
                  display: "flex", alignItems: "center", gap: "1rem",
                  padding: "1.1rem 1.4rem", borderRadius: "1.25rem",
                  border: `1.5px solid ${color}44`,
                  background: `${color}0c`,
                  cursor: sending ? "not-allowed" : "pointer",
                  opacity: sending ? 0.6 : 1,
                  transition: "transform 0.18s ease, background 0.18s ease",
                  width: "100%", textAlign: "left",
                }}
                  onMouseEnter={e => { if (!sending) { (e.currentTarget as HTMLButtonElement).style.background = `${color}1a`; (e.currentTarget as HTMLButtonElement).style.transform = "translateY(-1px)"; } }}
                  onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = `${color}0c`; (e.currentTarget as HTMLButtonElement).style.transform = ""; }}
                >
                  <div style={{
                    width: 38, height: 38, borderRadius: "50%", background: color,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0, color: "#fff", fontFamily: FF, fontWeight: 900, fontSize: "1rem",
                  }}>{icon}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: FF, fontWeight: 900, fontSize: "0.95rem", color: theme.text, textTransform: "uppercase", letterSpacing: "-0.01em" }}>{label}</p>
                    <p style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.73rem", color: theme.text, opacity: 0.5, marginTop: "0.1rem" }}>{desc}</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: theme.text, opacity: 0.3, flexShrink: 0 }}>
                    <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>

            {sending && (
              <p style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.8rem", color: "#16a34a", textAlign: "center", opacity: 0.85 }}>
                Initiating payment…
              </p>
            )}
          </>
        )}

        {/* ── STEP: MPESA WAITING ── */}
        {step === "mpesa_waiting" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.5rem", padding: "1.5rem 0", textAlign: "center" }}>
            {/* Animated spinner */}
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              border: "3px solid #00a65022",
              borderTop: "3px solid #00a650",
              animation: "mpesa-spin 1s linear infinite",
            }} />
            <style>{`@keyframes mpesa-spin { to { transform: rotate(360deg); } }`}</style>

            <div>
              <p style={{ fontFamily: FF, fontWeight: 900, fontSize: "clamp(1.2rem,3vw,1.7rem)", color: theme.text, textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "0.6rem" }}>
                Check your phone
              </p>
              <p style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.85rem", color: theme.text, opacity: 0.6, lineHeight: 1.65, maxWidth: "26ch", margin: "0 auto" }}>
                An M-Pesa prompt has been sent to <strong style={{ opacity: 1, color: theme.text }}>+254 {phone}</strong>.<br/>
                Enter your PIN to complete payment of <strong style={{ color: "#00a650" }}>Ksh {grand.toLocaleString()}</strong>.
              </p>
            </div>

            <div style={{
              background: "#00a65010", border: "1px solid #00a65033",
              borderRadius: "1rem", padding: "0.85rem 1.25rem",
              fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.75rem",
              color: theme.text, opacity: 0.7, lineHeight: 1.6,
            }}>
              Till Number: <strong>955371</strong> · Musi&apos;s Collection
            </div>
          </div>
        )}

        {/* ── STEP: SENT ── */}
        {step === "sent" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", padding: "1rem 0", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(22,163,74,0.12)", border: "2px solid #16a34a44",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M5 12l5 5L20 7" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: FF, fontWeight: 900, fontSize: "clamp(1.4rem,3vw,2rem)", color: theme.text, textTransform: "uppercase", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: "0.6rem" }}>
                Payment Confirmed!
              </p>
              <p style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.85rem", color: theme.text, opacity: 0.6, lineHeight: 1.6, maxWidth: "28ch" }}>
                We&apos;ve received your payment and sent a confirmation to <strong style={{ opacity: 1, color: theme.text }}>{email}</strong>. We&apos;ll be in touch shortly.
              </p>
            </div>
          </div>
        )}

        {/* ── STEP: ERROR ── */}
        {step === "error" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "1.25rem", padding: "1rem 0", textAlign: "center" }}>
            <div style={{
              width: 72, height: 72, borderRadius: "50%",
              background: "rgba(239,68,68,0.1)", border: "2px solid #ef444444",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
                <path d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="#ef4444" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </div>
            <div>
              <p style={{ fontFamily: FF, fontWeight: 900, fontSize: "clamp(1.2rem,3vw,1.6rem)", color: theme.text, textTransform: "uppercase", letterSpacing: "-0.02em", lineHeight: 1, marginBottom: "0.6rem" }}>
                Payment Failed
              </p>
              <p style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.82rem", color: theme.text, opacity: 0.6, lineHeight: 1.6 }}>
                {mpesaError || "Your payment couldn't be completed. Please try again or contact us on WhatsApp."}
              </p>
            </div>
            <button onClick={() => { setStep("payment"); setMpesaError(""); }} style={{
              padding: "0.85rem 2rem", background: "#16a34a", color: "#fff",
              border: "none", borderRadius: "999px", cursor: "pointer",
              fontFamily: FF, fontWeight: 900, fontSize: "0.9rem",
              textTransform: "uppercase", letterSpacing: "0.04em",
            }}>Try Again</button>
          </div>
        )}

      </div>
    </div>
  );
}

/* ─── BAG PAGE ──────────────────────────────────────────────────────────────── */
export default function BagPage() {
  const [theme, setTheme] = useState<Theme>(THEMES.green);
  const [visible, setVisible] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const isClient = useSyncExternalStore(() => () => {}, () => true, () => false);
  const { items, removeItem, updateQty, totalItems, totalPrice, clearBag } = useBag();

  useEffect(() => { document.body.style.background = theme.bg; document.body.style.color = theme.text; }, [theme]);
  useEffect(() => { const t = setTimeout(() => setVisible(true), 80); return () => clearTimeout(t); }, []);

  const isEmpty = items.length === 0;

  return (
    <>
      <div style={{
        minHeight: "100vh", background: theme.bg, fontFamily: FF,
        paddingTop: "8rem", paddingBottom: "6rem",
        paddingLeft: "clamp(1.5rem,5vw,5rem)", paddingRight: "clamp(1.5rem,5vw,5rem)",
        transition: "background 0.4s ease",
      }}>
        <div style={{
          marginBottom: "clamp(2rem,4vh,4rem)",
          opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.55s ease 0.1s, transform 0.55s cubic-bezier(0.16,1,0.3,1) 0.1s",
        }}>
          <h1 style={{
            fontFamily: FF, fontWeight: 900, fontSize: "clamp(3.5rem,9vw,8rem)",
            color: theme.text, textTransform: "uppercase", letterSpacing: "-0.04em", lineHeight: 0.9, marginBottom: "0.4rem",
          }}>Your Bag</h1>
          {!isEmpty && (
            <p style={{ fontFamily: "Helvetica, Arial, sans-serif", fontSize: "clamp(0.85rem,1.2vw,1rem)", color: theme.text, opacity: 0.55 }}>
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </p>
          )}
        </div>

        {isEmpty ? <EmptyBag theme={theme} visible={visible} /> : (
          <div style={{
            display: "grid", gridTemplateColumns: "minmax(0,1fr) min(360px,38vw)",
            gap: "clamp(2rem,4vw,5rem)", alignItems: "start",
          }}>
            <div>
              <div style={{ width: "100%", height: 1.5, background: theme.text, opacity: visible ? 0.2 : 0, transition: "opacity 0.4s ease 0.15s", marginBottom: 0 }} />
              {items.map((item, i) => (
                <BagRow key={item.id} item={item} theme={theme} index={i} visible={visible} onRemove={removeItem} onQtyChange={updateQty} />
              ))}
              <div style={{ marginTop: "1.5rem", opacity: visible ? 1 : 0, transition: `opacity 0.4s ease ${items.length * 80 + 200}ms` }}>
                <button onClick={clearBag} style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontFamily: "Helvetica, Arial, sans-serif", fontSize: "0.78rem",
                  color: theme.text, opacity: 0.4, textDecoration: "underline",
                  textUnderlineOffset: "3px", padding: 0, transition: "opacity 0.2s",
                }}
                  onMouseEnter={e => (e.currentTarget.style.opacity = "0.8")}
                  onMouseLeave={e => (e.currentTarget.style.opacity = "0.4")}
                >Clear bag</button>
              </div>
            </div>
            <OrderSummary theme={theme} totalPrice={totalPrice} itemCount={totalItems} visible={visible} onCheckout={() => setShowCheckout(true)} />
          </div>
        )}
      </div>

      {isClient && createPortal(
        <>
          <TransitionLink href="/" className="fixed top-2 left-2 z-30" aria-label="Home" style={{ pointerEvents: "auto" }}>
            <Image src="/favicon.ico" alt="Logo" width={160} height={100} priority />
          </TransitionLink>
          <NavBar theme={theme} onSelectTheme={setTheme} />
        </>,
        document.body,
      )}

      {isClient && showCheckout && createPortal(
        <CheckoutModal
          theme={theme} items={items} totalPrice={totalPrice}
          onClose={() => setShowCheckout(false)}
          onSuccess={clearBag}
        />,
        document.body,
      )}
    </>
  );
}