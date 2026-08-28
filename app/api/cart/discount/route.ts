import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { errorResponse, jsonError } from "@/lib/api-response";
import { isDiscountKind } from "@/lib/cart";
import { applyDiscount } from "@/lib/tebex";
import { normalizeString, readJsonObject } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);
  if (!body) return jsonError("Request body must be a JSON object.", 400);

  const code = normalizeString(body.code);
  if (!isDiscountKind(body.kind) || !code) {
    return jsonError("kind and code are required.", 400);
  }

  try {
    const cart = await applyDiscount(body.kind, code);
    return NextResponse.json(cart);
  } catch (error) {
    return errorResponse(error, "Could not apply code.");
  }
}
