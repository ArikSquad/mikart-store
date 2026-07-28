import type { CartState } from "@/lib/types";

export function createEmptyCart(): CartState {
  return {
    ident: null,
    lines: [],
    coupons: [],
    giftcards: [],
    creatorCode: null,
    basePrice: 0,
    salesTax: 0,
    totalPrice: 0,
    currency: "EUR",
    checkoutUrl: null,
    authUrl: null,
  };
}
