import { NextRequest, NextResponse } from "next/server";
import { removePackage } from "@/lib/tebex";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const packageId = Number(body.packageId);

  if (!Number.isFinite(packageId)) {
    return NextResponse.json({ error: "packageId is required" }, { status: 400 });
  }

  try {
    const cart = await removePackage(packageId);
    return NextResponse.json(cart);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not remove package." },
      { status: 502 }
    );
  }
}
