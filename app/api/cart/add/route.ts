import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { addPackage } from "@/lib/tebex";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const packageId = Number(body.packageId);
  const quantity = Math.max(1, Number(body.quantity ?? 1));
  const cookieStore = await cookies();
  const username = String(body.username ?? cookieStore.get("minecraft_username")?.value ?? "").trim();
  const giftUsername = String(body.giftUsername ?? "").trim();

  if (!Number.isFinite(packageId)) {
    return NextResponse.json({ error: "packageId is required" }, { status: 400 });
  }

  if (!username) {
    return NextResponse.json({ error: "Connect your Minecraft account first." }, { status: 401 });
  }

  try {
    const cart = await addPackage(packageId, quantity, username, giftUsername || undefined);
    const response = NextResponse.json(cart);
    if (cart.ident) {
      response.cookies.set("basket_ident", cart.ident, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24,
      });
    }
    if (username) {
      response.cookies.set("minecraft_username", username, {
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not add package." },
      { status: 502 }
    );
  }
}
