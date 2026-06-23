import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBasket } from "@/lib/tebex";

export async function GET() {
  const cookieStore = await cookies();
  const cart = await getBasket(cookieStore.get("basket_ident")?.value);
  return NextResponse.json(cart);
}
