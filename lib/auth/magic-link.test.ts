import { describe, expect, it } from "vitest";

import {
  buildMagicLinkUrl,
  hashMagicLinkToken,
  normalizeEmail,
} from "./magic-link";

describe("magic-link helpers", () => {
  it("normalizes email to lower case", () => {
    expect(normalizeEmail("  Viktor.Independent@GMAIL.com ")).toBe(
      "viktor.independent@gmail.com",
    );
  });

  it("hashes token deterministically", () => {
    expect(hashMagicLinkToken("token-1")).toBe(hashMagicLinkToken("token-1"));
    expect(hashMagicLinkToken("token-1")).not.toBe(hashMagicLinkToken("token-2"));
  });

  it("builds verify url on app domain", () => {
    expect(buildMagicLinkUrl("abc", "https://app.kpdoc.ru")).toBe(
      "https://app.kpdoc.ru/auth/verify?token=abc",
    );
  });
});
