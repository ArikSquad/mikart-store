import type { CartLine, CartState } from "@/lib/types";

export function createEmptyCart(lines: CartLine[] = []): CartState {
  const basePrice = Number(lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0).toFixed(2));

  return {
    ident: null,
    lines,
    coupons: [],
    giftcards: [],
    creatorCode: null,
    basePrice,
    salesTax: 0,
    totalPrice: basePrice,
    currency: "EUR",
    checkoutUrl: null,
    authUrl: null,
  };
}
