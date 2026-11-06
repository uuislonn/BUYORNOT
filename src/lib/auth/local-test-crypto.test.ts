import { describe, it, expect } from "vitest";
import {
  passwordHash,
  checkPassword,
  sessionToken,
  sessionIdentity,
} from "./local-test-crypto";
describe("local test authentication", () => {
  it("verifies a salted password without accepting a different password", () => {
    const hash = passwordHash("fixture-pass", "salt");
    expect(checkPassword("fixture-pass", "salt", hash)).toBe(true);
    expect(checkPassword("wrong", "salt", hash)).toBe(false);
    expect(checkPassword("fixture-pass", "other-salt", hash)).toBe(false);
  });
  it("accepts only an unexpired signed identity", () => {
    const token = sessionToken("member", "secret", 200);
    expect(sessionIdentity(token, "secret", 100)).toBe("member");
    expect(sessionIdentity(token, "secret", 200)).toBeNull();
    expect(sessionIdentity(token, "different-secret", 100)).toBeNull();
  });
  it("rejects substituting an administrator identity in a member cookie", () => {
    const token = sessionToken("member", "secret", 200);
    const payload = Buffer.from(
      JSON.stringify({ id: "admin", expires: 200 }),
    ).toString("base64url");
    expect(
      sessionIdentity(`${payload}.${token.split(".")[1]}`, "secret", 100),
    ).toBeNull();
  });
  it("rejects malformed and oversized credentials", () => {
    for (const token of [
      "",
      "garbage",
      "a.b",
      "a." + "0".repeat(64) + ".extra",
    ])
      expect(sessionIdentity(token, "secret", 0)).toBeNull();
    expect(
      checkPassword("a".repeat(129), "salt", passwordHash("a", "salt")),
    ).toBe(false);
  });
});
