import type { Basket, UserLimit } from "@/lib/types";

export const MAX_CART_QUANTITY = 64;
export const EMPTY_BASKET_CURRENCY = "EUR";

export const DISCOUNT_KINDS = ["coupon", "giftcard", "creator"] as const;
export type DiscountKind = (typeof DISCOUNT_KINDS)[number];

type QuantityLimitedItem = {
  disable_quantity?: boolean | undefined;
  user_limit?: UserLimit | undefined;
};

export function isDiscountKind(value: unknown): value is DiscountKind {
  return typeof value === "string" && DISCOUNT_KINDS.some((kind) => kind === value);
}

export function getMaxQuantity(item: QuantityLimitedItem): number {
  if (item.disable_quantity) return 1;

  const userLimit = getUserLimit(item.user_limit);
  return userLimit ? Math.min(userLimit, MAX_CART_QUANTITY) : MAX_CART_QUANTITY;
}

export function getUserLimit(value: UserLimit | undefined): number | undefined {
  const limit = typeof value === "number" ? value : value?.limit;
  return typeof limit === "number" && Number.isSafeInteger(limit) && limit > 0 ? limit : undefined;
}

export function createEmptyBasket(): Basket {
  return {
    ident: "",
    complete: false,
    id: "",
    country: "",
    ip: "",
    username_id: null,
    username: null,
    cancel_url: "",
    complete_url: null,
    complete_auto_redirect: false,
    coupons: [],
    giftcards: [],
    creator_code: "",
    base_price: 0,
    sales_tax: 0,
    total_price: 0,
    email: null,
    currency: EMPTY_BASKET_CURRENCY,
    packages: [],
    links: { checkout: "" },
  };
}
