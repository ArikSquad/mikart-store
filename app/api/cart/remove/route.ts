import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { errorResponse, jsonError } from "@/lib/api-response";
import { removePackage } from "@/lib/tebex";
import { parsePositiveInteger, readJsonObject } from "@/lib/validation";

export async function POST(request: NextRequest) {
  const body = await readJsonObject(request);
  if (!body) return jsonError("Request body must be a JSON object.", 400);

  const packageId = parsePositiveInteger(body.packageId);
  if (packageId === null) return jsonError("packageId must be a positive integer.", 400);

  try {
    const cart = await removePackage(packageId);
    return NextResponse.json(cart);
  } catch (error) {
    return errorResponse(error, "Could not remove package.");
  }
}
