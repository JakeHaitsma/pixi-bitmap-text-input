import { describe, expect, it } from "vitest";
import { BitmapTextInput } from "../src/BitmapTextInput";

describe("BitmapTextInput", () => {
  it("constructs without error", () => {
    const bitmapTextInput = new BitmapTextInput();
    expect(bitmapTextInput).toBeDefined();
  });
});
