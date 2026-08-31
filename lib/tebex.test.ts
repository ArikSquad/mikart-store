import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createBasket, parseBasketResponse, TebexError } from "@/lib/tebex";

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

  test("accepts Tebex's empty links array from a newly created basket", () => {
    const basket = parseBasketResponse({ data: basketFixture({ links: [] }) }, "create-basket");

    assert.deepEqual(basket.links, {});
  });

  test("rejects non-empty links arrays", () => {
    assert.throws(
      () =>
        parseBasketResponse(
          { data: basketFixture({ links: [{ checkout: "https://checkout.example/basket-1" }] }) },
          "create-basket",
        ),
      (error: unknown) => error instanceof TebexError && error.status === 502,
    );
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

describe("Tebex basket creation", () => {
  test("does not send an IP address through the public Headless API", async () => {
    const originalFetch = globalThis.fetch;
    const originalToken = process.env.TEBEX_PUBLIC_TOKEN;
    const captured = { url: "", body: undefined as Record<string, unknown> | undefined };

    process.env.TEBEX_PUBLIC_TOKEN = "test-public-token";
    globalThis.fetch = (input, init) => {
      captured.url =
        input instanceof Request ? input.url : input instanceof URL ? input.href : input;
      if (typeof init?.body !== "string") throw new Error("Expected a JSON request body.");
      captured.body = JSON.parse(init.body) as Record<string, unknown>;
      return Promise.resolve(
        new Response(JSON.stringify({ data: basketFixture({ username: "Notch", links: [] }) }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    };

    try {
      const basket = await createBasket("Notch");

      assert.equal(basket.ident, "basket-1");
      assert.equal(
        captured.url,
        "https://headless.tebex.io/api/accounts/test-public-token/baskets",
      );
      const requestBody = captured.body;
      assert.ok(requestBody);
      assert.equal(requestBody.username, "Notch");
      assert.equal("ip_address" in requestBody, false);
    } finally {
      globalThis.fetch = originalFetch;
      if (originalToken === undefined) delete process.env.TEBEX_PUBLIC_TOKEN;
      else process.env.TEBEX_PUBLIC_TOKEN = originalToken;
    }
  });
});
