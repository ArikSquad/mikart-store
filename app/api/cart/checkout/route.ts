import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBasket, getBasketAuth } from "@/lib/tebex";

export async function POST() {
  const cookieStore = await cookies();
  const cart = await getBasket(cookieStore.get("basket_ident")?.value);

  if (!cart.ident || cart.lines.length === 0) {
    return NextResponse.json({ error: "Your basket is empty." }, { status: 400 });
  }

  try {
    const authUrl = await getBasketAuth(cart.ident);
    return NextResponse.json({
      ident: cart.ident,
      checkoutUrl: cart.checkoutUrl,
      authUrl,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed." },
      { status: 502 }
    );
  }
}
