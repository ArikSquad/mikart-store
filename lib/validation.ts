import { parseJsonObject } from "@/lib/json";

const MINECRAFT_USERNAME_PATTERN = /^[A-Za-z0-9_]{3,16}$/;
const POSITIVE_INTEGER_PATTERN = /^\d+$/;

export function normalizeString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

export function isMinecraftUsername(value: string): boolean {
  return MINECRAFT_USERNAME_PATTERN.test(value);
}

export function sameMinecraftUsername(first: string, second: string): boolean {
  return first.toLowerCase() === second.toLowerCase();
}

export function parsePositiveInteger(
  value: unknown,
  maximum = Number.MAX_SAFE_INTEGER,
): number | null {
  const stringValue = typeof value === "string" ? value.trim() : "";
  const number =
    typeof value === "number"
      ? value
      : POSITIVE_INTEGER_PATTERN.test(stringValue)
        ? Number(stringValue)
        : Number.NaN;

  return Number.isSafeInteger(number) && number > 0 && number <= maximum ? number : null;
}

export async function readJsonObject(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return parseJsonObject(body);
  } catch {
    return null;
  }
}
