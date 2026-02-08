import { describe, expect, it } from "vitest";
import {
  parseAdvantagesColumns,
  productVariantSchema,
  proposalItemSchema,
  safeParseArray,
  safeParseObject,
  safeParseStringArray,
} from "./proposal-schema";

describe("proposal-schema helpers", () => {
  it("filters invalid proposal items instead of throwing", () => {
    const parsed = safeParseArray(
      [
        { id: "ok", name: "Item", qty: 1, price: 100 },
        { id: "bad", qty: "NaN" },
      ],
      proposalItemSchema,
    );

    expect(parsed).toHaveLength(1);
    expect(parsed[0]?.id).toBe("ok");
  });

  it("returns undefined for invalid objects", () => {
    const parsed = safeParseObject(
      {
        id: "v1",
        name: "Variant",
      },
      productVariantSchema,
    );

    expect(parsed).toBeUndefined();
  });

  it("keeps only string values in string arrays", () => {
    const parsed = safeParseStringArray(["a", 1, "b", null, "c"]);
    expect(parsed).toEqual(["a", "b", "c"]);
  });

  it("normalizes advantages columns to [1..3] with fallback", () => {
    expect(parseAdvantagesColumns(2)).toBe(2);
    expect(parseAdvantagesColumns("3")).toBe(3);
    expect(parseAdvantagesColumns("10")).toBe(3);
    expect(parseAdvantagesColumns(null)).toBe(3);
  });
});
