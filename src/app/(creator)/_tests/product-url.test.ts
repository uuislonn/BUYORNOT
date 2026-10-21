import { describe, expect, it } from "vitest";
import {
  formatPrice,
  getAffiliateLink,
  validateProductUrl,
} from "../_lib/product-url";
describe("mock product URL guard (no outbound fetch)", () => {
  it.each([
    "http://www.musinsa.com/products/1",
    "file:///etc/passwd",
    "javascript:alert(1)",
    "https://127.0.0.1/a",
    "https://2130706433/a",
    "https://0x7f000001/a",
    "https://[::1]/a",
    "https://[::ffff:127.0.0.1]/a",
    "https://169.254.169.254/latest/meta-data",
    "https://10.0.0.1",
    "https://172.16.0.1",
    "https://192.168.1.1",
    "https://localhost",
    "https://www.musinsa.com.evil.example/a",
    "https://evil.example/?url=https://www.musinsa.com",
    "https://www.musinsa.com@evil.example/a",
    "https://u:p@www.musinsa.com/a",
    "https://www.musinsa.com:8443/a",
    "https://www.musinsa.com./a",
    "https://musinsa%2Ecom.evil.example/a",
    "//www.musinsa.com/a",
    "not a url",
  ])("rejects %s", (url) => {
    expect(() => validateProductUrl(url)).toThrow();
  });
  it("canonicalizes query order, tracking, trailing slashes and fragments", () => {
    expect(
      validateProductUrl(
        "https://www.musinsa.com/products/1/?b=2&utm_source=test&a=1#top",
      ),
    ).toBe("https://www.musinsa.com/products/1?a=1&b=2");
  });
  it("normalizes supported www aliases for duplicate detection", () => {
    expect(validateProductUrl("https://musinsa.com/products/1")).toBe(
      validateProductUrl("https://www.musinsa.com/products/1"),
    );
  });
  it("uses a validated original link without fake affiliate credentials, including for guests", () => {
    expect(getAffiliateLink("https://www.29cm.co.kr/products/1")).toBe(
      "https://www.29cm.co.kr/products/1",
    );
    expect(() => getAffiliateLink("https://evil.example")).toThrow();
  });
  it("formats Korean prices and handles absent prices without inventing a value", () => {
    expect(formatPrice(129000)).toBe("129,000원");
    expect(formatPrice(null)).toBe("가격 확인 필요");
  });
});
