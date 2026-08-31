import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { parseJsonObject } from "@/lib/json";

describe("JSON object parsing", () => {
  test("accepts objects and rejects other JSON values", () => {
    const object = { nested: { enabled: true }, value: "ok" };

    assert.deepEqual(parseJsonObject(object), object);
    assert.equal(parseJsonObject(null), null);
    assert.equal(parseJsonObject([]), null);
    assert.equal(parseJsonObject("not an object"), null);
    assert.equal(parseJsonObject(42), null);
  });
});
