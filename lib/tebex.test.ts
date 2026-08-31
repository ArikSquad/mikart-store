import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseBasketResponse, TebexError } from "@/lib/tebex";

function basketFixture(overrides: Record<string, unknown> = {}) {
  return {
    ident: "basket-1",
    complete: false,
    id: 123,
    country: "DE",
    ip: "127.0.0.1",
    username_id: null,
    username: null,
    cancel_url: "https://example.com",
    complete_url: null,
    complete_auto_redirect: true,
    base_price: 0,
    sales_tax: 0,
    total_price: 0,
    email: null,
    currency: "EUR",
    packages: [],
    coupons: [],
    giftcards: [],
    creator_code: null,
    ...overrides,
  };
}

describe("Tebex basket response parsing", () => {
  test("normalizes the documented envelope and field variants", () => {
    const basket = parseBasketResponse({
      data: basketFixture({
        packages: [
          {
            id: 10,
            name: "VIP",
            description: "VIP rank",
            in_basket: { quantity: 1, price: 5 },
          },
        ],
        coupons: [{ code: "SAVE10" }],
        giftcards: [{ card_number: 1234 }],
      }),
      links: { checkout: "https://checkout.example/basket-1" },
    });

    assert.equal(basket.id, "123");
    assert.deepEqual(basket.coupons, [{ coupon_code: "SAVE10" }]);
    assert.deepEqual(basket.giftcards, [{ card_number: "1234" }]);
    const packageInBasket = basket.packages[0];
    assert.ok(packageInBasket);
    assert.equal(packageInBasket.image, null);
    assert.equal(packageInBasket.in_basket.gift_username, null);
    assert.equal(basket.links.checkout, "https://checkout.example/basket-1");
  });

  test("accepts the bare basket returned by package mutations", () => {
    const basket = parseBasketResponse(
      basketFixture({
        id: "basket-id",
        links: { checkout: "https://checkout.example/basket-1" },
      }),
    );

    assert.equal(basket.ident, "basket-1");
    assert.equal(basket.id, "basket-id");
  });

  test("accepts a null links value from a newly created basket", () => {
    const basket = parseBasketResponse({ data: basketFixture({ links: null }) }, "create-basket");

    assert.deepEqual(basket.links, {});
  });

  test("rejects malformed responses with a server error", () => {
    assert.throws(
      () => parseBasketResponse({ data: { ident: "missing-required-fields" } }),
      (error: unknown) =>
        error instanceof TebexError &&
        error.status === 502 &&
        error.message === "Tebex returned an invalid basket.",
    );
  });
});
