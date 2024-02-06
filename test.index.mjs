import assert from "node:assert";
import test from "node:test";
import { addOne } from "./index.mjs";

test("Adds 1 to value", () => {
  assert.strictEqual(addOne(1), 2);
});
