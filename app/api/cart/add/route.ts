import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { errorResponse, jsonError } from "@/lib/api-response";
import { MAX_CART_QUANTITY } from "@/lib/cart";
import { isBasket } from "@/lib/guards";
import { addPackage } from "@/lib/tebex";
import { isMinecraftUsername, normalizeString, parsePositiveInteger, readJsonObject } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);
  if (!body) return jsonError("Request body must be a JSON object.", 400);

  const packageId = parsePositiveInteger(body.packageId);
  const quantity = parsePositiveInteger(body.quantity ?? 1, MAX_CART_QUANTITY);
  if (packageId === null) return jsonError("packageId must be a positive integer.", 400);
  if (quantity === null) {
    return jsonError(`quantity must be an integer between 1 and ${MAX_CART_QUANTITY}.`, 400);
  }

  const cookieStore = await cookies();
  const username = normalizeString(body.username ?? cookieStore.get("minecraft_username")?.value);
  const giftUsername = normalizeString(body.giftUsername);

  if (!username) return jsonError("Connect your Minecraft account first.", 401);
  if (!isMinecraftUsername(username)) return jsonError("Enter a valid Minecraft username.", 400);
  if (giftUsername && !isMinecraftUsername(giftUsername)) {
    return jsonError("Enter a valid recipient Minecraft username.", 400);
  }

  try {
    const cart = await addPackage(packageId, quantity, username, giftUsername || undefined);
    if (!isBasket(cart)) return jsonError("Tebex returned an invalid basket.", 502);

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
    response.cookies.set("minecraft_username", username, {
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  } catch (error) {
    return errorResponse(error, "Could not add package.");
  }
}
