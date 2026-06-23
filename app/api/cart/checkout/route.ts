import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBasket, getBasketAuth } from "@/lib/tebex";

export async function POST() {
  if (!process.env.TEBEX_PUBLIC_TOKEN) {
    return NextResponse.json({
      ident: "demo-basket",
      checkoutUrl: null,
      authUrl: null,
      demo: true,
    });
  }

  const cookieStore = await cookies();
  const cart = await getBasket(cookieStore.get("basket_ident")?.value);

  if (!cart.ident || cart.lines.length === 0) {
    return NextResponse.json({ error: "Your basket is empty." }, { status: 400 });
  }

  try {
    const authUrl = cart.demo ? null : await getBasketAuth(cart.ident);
    return NextResponse.json({
      ident: cart.ident,
      checkoutUrl: cart.checkoutUrl,
      authUrl,
      demo: cart.demo,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed." },
      { status: 502 }
    );
  }
}
