import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { createEmptyBasket, getMaxQuantity, isDiscountKind } from "@/lib/cart";
import { isBasket, isCheckoutResponse } from "@/lib/guards";
import { getPackageDetails } from "@/lib/package-details";
import { storefrontSchema } from "@/lib/schemas";
import { parsePositiveInteger } from "@/lib/validation";

describe("cart helpers", () => {
  test("honors package limits and the global quantity cap", () => {
    assert.equal(getMaxQuantity({ disable_quantity: true }), 1);
    assert.equal(getMaxQuantity({ user_limit: { limit: 3 } }), 3);
    assert.equal(getMaxQuantity({ user_limit: 100 }), 64);
    assert.equal(getMaxQuantity({}), 64);
  });

  test("accepts only supported discount kinds", () => {
    assert.equal(isDiscountKind("coupon"), true);
    assert.equal(isDiscountKind("giftcard"), true);
    assert.equal(isDiscountKind("not-a-code"), false);
    assert.equal(isDiscountKind(null), false);
  });
});

describe("request validation", () => {
  test("parses bounded positive integers without coercing invalid values", () => {
    assert.equal(parsePositiveInteger(4), 4);
    assert.equal(parsePositiveInteger("4", 4), 4);
    assert.equal(parsePositiveInteger(0), null);
    assert.equal(parsePositiveInteger(-1), null);
    assert.equal(parsePositiveInteger(1.5), null);
    assert.equal(parsePositiveInteger("", 4), null);
    assert.equal(parsePositiveInteger("1e2", 200), null);
    assert.equal(parsePositiveInteger(5, 4), null);
  });
});

describe("API response guards", () => {
  test("accept the local empty basket shape and reject malformed responses", () => {
    assert.equal(isBasket(createEmptyBasket()), true);
    assert.equal(isBasket({ ...createEmptyBasket(), creator_code: 42 }), false);
    assert.equal(isCheckoutResponse({ ident: "basket-1", auth_url: null }), true);
    assert.equal(isCheckoutResponse({ ident: 42 }), false);
  });

  test("validates and narrows storefront payloads", () => {
    const result = storefrontSchema.safeParse({
      categories: [{
        id: 1,
        name: "Ranks",
        description: "Store ranks",
        packages: [{
          id: 10,
          name: "VIP",
          description: "VIP rank",
          disable_gifting: false,
          disable_quantity: true,
          currency: "EUR",
          base_price: 5,
          total_price: 5,
          discount: 0,
          image: null,
          ignored_remote_field: "not serialized",
        }],
        slug: "ranks",
      }],
      modules: [],
      currency: "EUR",
    });

    assert.equal(result.success, true);
    const category = result.data.categories[0];
    assert.ok(category?.packages);
    const product = category.packages[0];
    assert.ok(product);
    assert.equal("ignored_remote_field" in product, false);
    assert.equal(storefrontSchema.safeParse({ categories: "invalid", modules: [] }).success, false);
  });
});

describe("package details", () => {
  test("extracts feature rows and sanitizes the remaining description", () => {
    const details = getPackageDetails(
      '<table><tr><td>yes</td><td>Fast commands</td></tr><tr><td>no</td><td>Bad behavior</td></tr></table><p>More <strong>details</strong>.</p><script>alert(1)</script>'
    );

    assert.deepEqual(details.features, [
      { positive: true, text: "Fast commands" },
      { positive: false, text: "Bad behavior" },
    ]);
    assert.match(details.detailsHtml, /More <strong>details<\/strong>\./);
    assert.doesNotMatch(details.detailsHtml, /script/);
  });
});
