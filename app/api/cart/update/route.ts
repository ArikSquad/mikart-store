import { NextRequest, NextResponse } from "next/server";
import { updatePackageQuantity } from "@/lib/tebex";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const packageId = Number(body.packageId);
  const quantity = Math.max(1, Number(body.quantity ?? 1));

  if (!Number.isFinite(packageId)) {
    return NextResponse.json({ error: "packageId is required" }, { status: 400 });
  }

  try {
    const cart = await updatePackageQuantity(packageId, quantity);
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not update package quantity." },
      { status: 502 }
    );
  }
}
