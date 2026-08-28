import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { errorResponse } from "@/lib/api-response";
import { createEmptyBasket } from "@/lib/cart";
import { getBasket } from "@/lib/tebex";
import { normalizeString, sameMinecraftUsername } from "@/lib/validation";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cart = await getBasket(cookieStore.get("basket_ident")?.value);
    const username = normalizeString(cookieStore.get("minecraft_username")?.value);

    if (cart.username && username && !sameMinecraftUsername(cart.username, username)) {
      return NextResponse.json(createEmptyBasket());
    }

    return NextResponse.json(cart);
  } catch (error) {
    return errorResponse(error, "Could not load your basket.");
  }
}
