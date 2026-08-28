import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { errorResponse, jsonError } from "@/lib/api-response";
import { getBasket, getBasketAuth } from "@/lib/tebex";
import { isMinecraftUsername, normalizeString, readJsonObject, sameMinecraftUsername } from "@/lib/validation";

export async function POST(request: NextRequest) {
  try {
    const body = await readJsonObject(request);
    if (!body) return jsonError("Request body must be a JSON object.", 400);

    const username = normalizeString(body.username);
    if (!isMinecraftUsername(username)) return jsonError("Connect your Minecraft account first.", 401);

    const cookieStore = await cookies();
    const cart = await getBasket(cookieStore.get("basket_ident")?.value);

    if (!cart.ident || cart.packages.length === 0) {
      return jsonError("Your basket is empty.", 400);
    }
    if (cart.username && !sameMinecraftUsername(cart.username, username)) {
      return jsonError("This basket belongs to a different Minecraft account.", 409);
    }

    if (!cart.links.checkout) return jsonError("Checkout is currently unavailable.", 502);

    const authUrl = await getBasketAuth(cart.ident);
    return NextResponse.json({
      ident: cart.ident,
      checkout_url: cart.links.checkout,
      auth_url: authUrl,
    });
  } catch (error) {
    return errorResponse(error, "Checkout failed.");
  }
}
