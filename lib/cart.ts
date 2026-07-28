import type { Basket } from "@/lib/types";

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
    currency: "EUR",
    packages: [],
    links: { checkout: "" },
    custom: null,
  };
}
