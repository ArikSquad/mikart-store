import type { Basket, BasketPackage, CheckoutResponse, MinecraftServerStatus } from "@/lib/types";
import { isRecord } from "@/lib/validation";

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isBasketPackage(value: unknown): value is BasketPackage {
  if (!isRecord(value) || !isRecord(value.in_basket)) return false;

  return (
    isFiniteNumber(value.id) &&
    typeof value.name === "string" &&
    typeof value.description === "string" &&
    isNullableString(value.image) &&
    isFiniteNumber(value.in_basket.quantity) &&
    isFiniteNumber(value.in_basket.price) &&
    isNullableString(value.in_basket.gift_username_id) &&
    isNullableString(value.in_basket.gift_username)
  );
}

function isCodeList(value: unknown, field: "coupon_code" | "card_number"): boolean {
  return Array.isArray(value) && value.every((item) => isRecord(item) && typeof item[field] === "string");
}

export function isBasket(value: unknown): value is Basket {
  if (!isRecord(value) || !isRecord(value.links)) return false;

  return (
    typeof value.ident === "string" &&
    typeof value.complete === "boolean" &&
    typeof value.id === "string" &&
    typeof value.country === "string" &&
    typeof value.ip === "string" &&
    (value.username_id === null || typeof value.username_id === "string" || isFiniteNumber(value.username_id)) &&
    isNullableString(value.username) &&
    typeof value.cancel_url === "string" &&
    isNullableString(value.complete_url) &&
    typeof value.complete_auto_redirect === "boolean" &&
    isFiniteNumber(value.base_price) &&
    isFiniteNumber(value.sales_tax) &&
    isFiniteNumber(value.total_price) &&
    isNullableString(value.email) &&
    typeof value.currency === "string" &&
    Array.isArray(value.packages) &&
    value.packages.every(isBasketPackage) &&
    isCodeList(value.coupons, "coupon_code") &&
    isCodeList(value.giftcards, "card_number") &&
    (value.creator_code === null || typeof value.creator_code === "string") &&
    (value.links.checkout === undefined || typeof value.links.checkout === "string") &&
    (value.custom === null || isRecord(value.custom))
  );
}

export function isCheckoutResponse(value: unknown): value is CheckoutResponse {
  if (!isRecord(value)) return false;

  return (
    typeof value.ident === "string" &&
    (value.checkout_url === undefined || isNullableString(value.checkout_url)) &&
    (value.auth_url === undefined || isNullableString(value.auth_url))
  );
}

export function isMinecraftServerStatus(value: unknown): value is MinecraftServerStatus {
  if (!isRecord(value)) return false;

  return (
    typeof value.online === "boolean" &&
    isNonNegativeNumber(value.players) &&
    (value.max_players === undefined || isNonNegativeNumber(value.max_players))
  );
}
