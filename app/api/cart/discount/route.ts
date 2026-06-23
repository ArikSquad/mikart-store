import { NextRequest, NextResponse } from "next/server";
import { applyDiscount } from "@/lib/tebex";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const kind = body.kind as "coupon" | "giftcard" | "creator";
  const code = String(body.code ?? "").trim();

  if (!["coupon", "giftcard", "creator"].includes(kind) || !code) {
    return NextResponse.json({ error: "kind and code are required" }, { status: 400 });
  }

  try {
    const cart = await applyDiscount(kind, code);
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not apply code." },
      { status: 502 }
    );
  }
}
