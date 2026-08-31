import { z } from "zod";

export const jsonObjectSchema = z.record(z.string(), z.unknown());
export type JsonObject = z.infer<typeof jsonObjectSchema>;

/** Parse an unknown value at a JSON object boundary. */
export function parseJsonObject(value: unknown): JsonObject | null {
  const result = jsonObjectSchema.safeParse(value);
  return result.success ? result.data : null;
}
