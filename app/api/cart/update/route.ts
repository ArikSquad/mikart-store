import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { errorResponse, jsonError } from "@/lib/api-response";
import { MAX_CART_QUANTITY } from "@/lib/cart";
import { updatePackageQuantity } from "@/lib/tebex";
import { parsePositiveInteger, readJsonObject } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);
  if (!body) return jsonError("Request body must be a JSON object.", 400);

  const packageId = parsePositiveInteger(body.packageId);
  const quantity = parsePositiveInteger(body.quantity, MAX_CART_QUANTITY);
  if (packageId === null) return jsonError("packageId must be a positive integer.", 400);
  if (quantity === null) {
    return jsonError(`quantity must be an integer between 1 and ${MAX_CART_QUANTITY}.`, 400);
  }

  try {
    const cart = await updatePackageQuantity(packageId, quantity);
    return NextResponse.json(cart);
  } catch (error) {
    return errorResponse(error, "Could not update package quantity.");
  }
}
