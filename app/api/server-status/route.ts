import { NextResponse } from "next/server";
import { getMinecraftServerStatus } from "@/lib/tebex";

export async function GET() {
  const status = await getMinecraftServerStatus();
  return NextResponse.json(status);
}
