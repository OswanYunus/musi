// app/api/mpesa/stkpush/route.ts
//
// Initiates an M-Pesa STK Push to a Buy Goods till (CustomerBuyGoodsOnline).
//
// Required env vars (add to .env.local):
//   MPESA_CONSUMER_KEY      — from Daraja app
//   MPESA_CONSUMER_SECRET   — from Daraja app
//   MPESA_PASSKEY           — Lipa Na M-Pesa Online passkey (from Daraja dashboard)
//   MPESA_SHORTCODE         — your till number: 955371
//   MPESA_TILL              — same as shortcode for Buy Goods: 955371
//   NEXT_PUBLIC_BASE_URL    — your public HTTPS URL (e.g. https://yourstore.com)
//
// Sandbox base URL:    https://sandbox.safaricom.co.ke
// Production base URL: https://api.safaricom.co.ke
//
// Switch MPESA_ENV=production in .env.local when going live.

import { NextRequest, NextResponse } from "next/server";

const IS_PROD = process.env.MPESA_ENV === "production";
const BASE_URL = IS_PROD
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

// ── 1. Get OAuth token ───────────────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const key    = process.env.MPESA_CONSUMER_KEY!;
  const secret = process.env.MPESA_CONSUMER_SECRET!;
  const creds  = Buffer.from(`${key}:${secret}`).toString("base64");

  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${creds}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`M-Pesa auth failed: ${text}`);
  }

  const data = await res.json();
  return data.access_token as string;
}

// ── 2. Build the base64 password ─────────────────────────────────────────────
// Format: Base64(Shortcode + Passkey + Timestamp)
function buildPassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey   = process.env.MPESA_PASSKEY!;
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

// ── 3. Format timestamp ───────────────────────────────────────────────────────
// Required format: YYYYMMDDHHmmss
function getTimestamp(): string {
  return new Date()
    .toISOString()
    .replace(/[-T:.Z]/g, "")
    .slice(0, 14);
}

// ── 4. Sanitise phone number to 254XXXXXXXXX format ──────────────────────────
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("0"))   return `254${digits.slice(1)}`;
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits;
}

// ── POST handler ─────────────────────────────────────────────────────────────
export interface StkPushRequest {
  phone:       string;   // customer phone, any format
  amount:      number;   // KES, whole number
  orderRef:    string;   // short description shown on phone (≤12 chars recommended)
}

export async function POST(req: NextRequest) {
  try {
    const body: StkPushRequest = await req.json();
    const { phone, amount, orderRef } = body;

    if (!phone || !amount || !orderRef) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const timestamp   = getTimestamp();
    const password    = buildPassword(timestamp);
    const accessToken = await getAccessToken();
    const msisdn      = formatPhone(phone);
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/api/mpesa/callback`;

    const payload = {
      BusinessShortCode: process.env.MPESA_SHORTCODE,   // 955371
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   IS_PROD ? "CustomerBuyGoodsOnline" : "CustomerPayBillOnline",       // ← Buy Goods till
      Amount:            Math.round(amount),             // must be integer
      PartyA:            msisdn,                         // customer phone
      PartyB:           IS_PROD ? process.env.MPESA_TILL! : "174379",         // 955371 (your till)
      PhoneNumber:       msisdn,                         // phone to receive prompt
      CallBackURL:       callbackUrl,
      AccountReference:  orderRef.slice(0, 12),
      TransactionDesc:   "Musi's Collection",
    };

    const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (data.ResponseCode !== "0") {
      console.error("STK push error:", data);
      return NextResponse.json(
        { error: data.ResponseDescription ?? "STK push failed" },
        { status: 400 },
      );
    }

    // Return the CheckoutRequestID so the client can poll for status
    return NextResponse.json({
      ok:                true,
      checkoutRequestId: data.CheckoutRequestID,
      merchantRequestId: data.MerchantRequestID,
    });

  } catch (err) {
    console.error("STK push exception:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}