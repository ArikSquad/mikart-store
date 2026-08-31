import { z } from "zod";
import { basketSchema, minecraftServerStatusSchema } from "@/lib/schemas";
import type { Basket, CheckoutResponse, MinecraftServerStatus } from "@/lib/types";

const checkoutResponseSchema = z.object({
  ident: z.string(),
  checkout_url: z.string().nullable().optional(),
  auth_url: z.string().nullable().optional(),
});

export function isBasket(value: unknown): value is Basket {
  return basketSchema.safeParse(value).success;
}

export function isCheckoutResponse(value: unknown): value is CheckoutResponse {
  return checkoutResponseSchema.safeParse(value).success;
}

export function isMinecraftServerStatus(value: unknown): value is MinecraftServerStatus {
  return minecraftServerStatusSchema.safeParse(value).success;
}
