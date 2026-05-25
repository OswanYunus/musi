// app/api/mpesa/callback/route.ts
//
// Safaricom calls this endpoint after the customer enters their PIN.
// ResultCode 0  = success
// ResultCode != 0 = failure / timeout / cancelled
//
// In a production app you would:
//   - Verify the request comes from Safaricom (IP allowlist or a secret token)
//   - Write the result to a database
//   - Trigger order fulfilment
//
// For now we log the payload and return 200 so Safaricom stops retrying.

import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const stk  = body?.Body?.stkCallback;

    if (!stk) {
      return NextResponse.json({ ok: false, error: "Unexpected payload" }, { status: 400 });
    }

    const {
      MerchantRequestID,
      CheckoutRequestID,
      ResultCode,
      ResultDesc,
      CallbackMetadata,
    } = stk;

    if (ResultCode === 0) {
      // Payment succeeded — extract metadata
      const meta: Record<string, string | number> = {};
      for (const item of CallbackMetadata?.Item ?? []) {
        meta[item.Name] = item.Value;
      }

      console.log("✅ M-Pesa payment received:", {
        CheckoutRequestID,
        MerchantRequestID,
        amount:     meta["Amount"],
        mpesaCode:  meta["MpesaReceiptNumber"],   // e.g. QHF12345XYZ
        phone:      meta["PhoneNumber"],
        date:       meta["TransactionDate"],
      });

      // TODO: mark the order as paid in your database
      // await db.orders.update({ where: { checkoutRequestId: CheckoutRequestID }, data: { paid: true, mpesaCode: meta["MpesaReceiptNumber"] } });

    } else {
      // Payment failed or was cancelled
      console.warn("❌ M-Pesa STK cancelled/failed:", { ResultCode, ResultDesc, CheckoutRequestID });
      // TODO: mark order as failed / notify customer
    }

    // Always respond 200 — otherwise Safaricom retries
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

  } catch (err) {
    console.error("Callback parse error:", err);
    return NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" }); // still 200
  }
}