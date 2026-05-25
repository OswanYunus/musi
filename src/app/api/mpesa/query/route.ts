// app/api/mpesa/query/route.ts
//
// Polls Safaricom for the result of an STK push using CheckoutRequestID.
// Call this every ~3 seconds after initiating the push, for up to ~60 seconds.
//
// ResultCode 0                  = paid ✅
// ResultCode 1032               = cancelled by user
// ResultCode 1037               = timeout
// ResultCode 2001               = wrong PIN (too many attempts)
// "The transaction is being processed" = still pending, keep polling

import { NextRequest, NextResponse } from "next/server";

const IS_PROD = process.env.MPESA_ENV === "production";
const BASE_URL = IS_PROD
  ? "https://api.safaricom.co.ke"
  : "https://sandbox.safaricom.co.ke";

async function getAccessToken(): Promise<string> {
  const key    = process.env.MPESA_CONSUMER_KEY!;
  const secret = process.env.MPESA_CONSUMER_SECRET!;
  const creds  = Buffer.from(`${key}:${secret}`).toString("base64");
  const res    = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${creds}` },
  });
  const data = await res.json();
  return data.access_token as string;
}

function getTimestamp(): string {
  return new Date().toISOString().replace(/[-T:.Z]/g, "").slice(0, 14);
}

function buildPassword(timestamp: string): string {
  const shortcode = process.env.MPESA_SHORTCODE!;
  const passkey   = process.env.MPESA_PASSKEY!;
  return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString("base64");
}

export async function POST(req: NextRequest) {
  try {
    const { checkoutRequestId } = await req.json();
    if (!checkoutRequestId) {
      return NextResponse.json({ error: "Missing checkoutRequestId" }, { status: 400 });
    }

    const timestamp   = getTimestamp();
    const accessToken = await getAccessToken();

    const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        BusinessShortCode: process.env.MPESA_SHORTCODE,
        Password:          buildPassword(timestamp),
        Timestamp:         timestamp,
        CheckoutRequestID: checkoutRequestId,
      }),
    });

    const data = await res.json();

    // "pending" when Safaricom hasn't processed yet
    const pending = data.errorMessage?.includes("being processed") ||
                    data.ResponseCode === undefined;

    return NextResponse.json({
      ok:          data.ResultCode === "0",
      pending,
      resultCode:  data.ResultCode,
      resultDesc:  data.ResultDesc ?? data.errorMessage,
    });

  } catch (err) {
    console.error("STK query error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}