// app/api/checkout/route.ts
//
// Sends a booking confirmation email to the store owner AND a receipt to the customer.
//
// Setup:
//   1. npm install resend
//   2. Sign up at https://resend.com (free — 100 emails/day)
//   3. Get your API key from the Resend dashboard
//   4. Add to .env.local:
//        RESEND_API_KEY=re_xxxxxxxxxxxx
//        EMAIL_TO=yourstore@gmail.com   (owner inbox — where booking notifications land)
//
//   Note: On Resend's free tier (no verified domain), emails are sent from
//   onboarding@resend.dev and can only be delivered to the email you signed up with.
//   Once you add and verify a custom domain in Resend, you can send to anyone.

import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  qty: number;
}

interface CheckoutPayload {
  name: string;
  email: string;
  phone: string;
  method: string;
  items: OrderItem[];
  totalPrice: number;
  shipping: number;
}

const METHOD_LABELS: Record<string, string> = {
  mpesa:  "M-Pesa",
  paypal: "PayPal",
  card:   "Credit / Debit Card",
};

function itemsTable(items: OrderItem[]): string {
  return items.map(i =>
    `<tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;font-family:Helvetica,Arial,sans-serif;font-size:14px;">${i.name}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:14px;">${i.qty}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right;font-family:Helvetica,Arial,sans-serif;font-size:14px;">Ksh ${(i.price * i.qty).toLocaleString()}</td>
    </tr>`
  ).join("");
}

// ── Email to the store owner ─────────────────────────────────────────────────
function ownerHtml(p: CheckoutPayload): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f0eb;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr><td style="background:#166534;padding:32px 36px;">
        <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.03em;text-transform:uppercase;">
          New Booking 🛍
        </p>
        <p style="margin:6px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.7);">
          Musi's Collection — ${new Date().toLocaleDateString("en-KE", { dateStyle: "full" })}
        </p>
      </td></tr>

      <!-- Customer details -->
      <tr><td style="padding:28px 36px 0;">
        <p style="margin:0 0 14px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Customer</p>
        <table cellpadding="0" cellspacing="0" width="100%">
          ${[["Name", p.name], ["Email", `<a href="mailto:${p.email}" style="color:#166534;">${p.email}</a>`], ["Phone", `+254 ${p.phone}`], ["Payment", METHOD_LABELS[p.method] ?? p.method]].map(([k, v]) => `
          <tr>
            <td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#888;width:90px;vertical-align:top;">${k}</td>
            <td style="padding:6px 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#111;font-weight:600;">${v}</td>
          </tr>`).join("")}
        </table>
      </td></tr>

      <!-- Items -->
      <tr><td style="padding:24px 36px 0;">
        <p style="margin:0 0 12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Order</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;">
          <tr style="background:#f9f6f2;">
            <th style="padding:8px 12px;text-align:left;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#888;">Item</th>
            <th style="padding:8px 12px;text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#888;">Qty</th>
            <th style="padding:8px 12px;text-align:right;font-family:Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#888;">Price</th>
          </tr>
          ${itemsTable(p.items)}
          <tr style="background:#f9f6f2;">
            <td colspan="2" style="padding:10px 12px;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#888;">Shipping</td>
            <td style="padding:10px 12px;text-align:right;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#111;">${p.shipping === 0 ? "Free" : `Ksh ${p.shipping.toLocaleString()}`}</td>
          </tr>
          <tr style="background:#166534;">
            <td colspan="2" style="padding:12px 12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:900;color:#fff;text-transform:uppercase;letter-spacing:-0.01em;">Total</td>
            <td style="padding:12px 12px;text-align:right;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;font-weight:900;color:#fff;">Ksh ${p.totalPrice.toLocaleString()}</td>
          </tr>
        </table>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:28px 36px 32px;">
        <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#aaa;line-height:1.6;">
          Reply directly to this email to reach the customer.<br/>
          This booking was submitted from Musi's Collection online store.
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

// ── Confirmation email to customer ──────────────────────────────────────────
function customerHtml(p: CheckoutPayload): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f5f0eb;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0eb;padding:40px 0;">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

      <!-- Header -->
      <tr><td style="background:#166534;padding:32px 36px;">
        <p style="margin:0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.03em;text-transform:uppercase;">
          We got your order.
        </p>
        <p style="margin:6px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:rgba(255,255,255,0.7);">
          Musi's Collection · Mombasa, Likoni
        </p>
      </td></tr>

      <!-- Greeting -->
      <tr><td style="padding:28px 36px 0;">
        <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:#333;line-height:1.7;">
          Hi <strong>${p.name.split(" ")[0]}</strong>,<br/><br/>
          Your booking request has been received. We'll confirm availability and reach out to you on <strong>${p.phone}</strong> within 24 hours to arrange payment and delivery.
        </p>
      </td></tr>

      <!-- Items -->
      <tr><td style="padding:24px 36px 0;">
        <p style="margin:0 0 12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#888;">Your order</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eee;border-radius:8px;overflow:hidden;">
          ${itemsTable(p.items)}
          <tr style="background:#f9f6f2;">
            <td colspan="2" style="padding:10px 12px;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#888;">Shipping</td>
            <td style="padding:10px 12px;text-align:right;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#111;">${p.shipping === 0 ? "Free" : `Ksh ${p.shipping.toLocaleString()}`}</td>
          </tr>
          <tr style="background:#166534;">
            <td colspan="2" style="padding:12px;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;font-weight:900;color:#fff;text-transform:uppercase;">Total</td>
            <td style="padding:12px;text-align:right;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;font-size:16px;font-weight:900;color:#fff;">Ksh ${p.totalPrice.toLocaleString()}</td>
          </tr>
        </table>
      </td></tr>

      <!-- Payment method -->
      <tr><td style="padding:20px 36px 0;">
        <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:13px;color:#555;">
          Requested payment via: <strong>${METHOD_LABELS[p.method] ?? p.method}</strong>
        </p>
      </td></tr>

      <!-- Footer -->
      <tr><td style="padding:28px 36px 32px;">
        <div style="border-top:1px solid #eee;padding-top:20px;">
          <p style="margin:0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#aaa;line-height:1.7;">
            Questions? Reply to this email or reach us on WhatsApp.<br/>
            <strong style="color:#166534;">Musi's Collection</strong> — Mombasa, Likoni. © 2026
          </p>
        </div>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  const payload: CheckoutPayload = await req.json();
  const { name, email, phone, method, items, totalPrice } = payload;

  // Basic server-side validation
  if (!name || !email || !phone || !method || !items?.length) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  const ownerInbox = process.env.EMAIL_TO;

  if (!apiKey) {
    console.error("❌ Email disabled: RESEND_API_KEY missing from environment.");
    return NextResponse.json(
      { ok: false, error: "Email service not configured" },
      { status: 500 }
    );
  }

  if (!ownerInbox) {
    console.error("❌ Email disabled: EMAIL_TO missing from environment.");
    return NextResponse.json(
      { ok: false, error: "Owner email not configured" },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  // Use Resend's default sender for free tier; replace with your domain once verified
  const fromAddress = process.env.EMAIL_FROM ?? "Musi's Collection <onboarding@resend.dev>";
  const subject = `New Booking — ${name} — Ksh ${totalPrice.toLocaleString()}`;

  // ── 1. Owner notification (priority) ────────────────────────────────────────
  try {
    const ownerResult = await resend.emails.send({
      from:    fromAddress,
      to:      [ownerInbox],
      replyTo: email,
      subject,
      html:    ownerHtml(payload),
    });

    if (ownerResult.error) {
      console.error("❌ Owner email failed:", ownerResult.error);
      return NextResponse.json(
        { ok: false, error: `Owner email failed: ${ownerResult.error.message}` },
        { status: 500 }
      );
    }

    console.log("✅ Owner email sent:", ownerResult.data?.id);
  } catch (err) {
    console.error("❌ Owner email exception:", err);
    return NextResponse.json(
      { ok: false, error: "Failed to send owner notification" },
      { status: 500 }
    );
  }

  // ── 2. Customer receipt (best-effort — may fail on free tier without domain) ─
  try {
    const custResult = await resend.emails.send({
      from:    fromAddress,
      to:      [email],
      subject: `Your booking is confirmed — Musi's Collection`,
      html:    customerHtml(payload),
    });

    if (custResult.error) {
      // Non-fatal: customer email is nice-to-have; owner already received theirs
      console.warn("⚠️  Customer email failed (non-fatal):", custResult.error.message);
    } else {
      console.log("✅ Customer email sent:", custResult.data?.id);
    }
  } catch (err) {
    console.warn("⚠️  Customer email exception (non-fatal):", err);
  }

  return NextResponse.json({ ok: true });
}