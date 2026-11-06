import { describe, expect, it } from "vitest";
import { productPricing } from "../_lib/product-price";
import { parseProductMetadata } from "../_server/product-metadata";
import { createSeed } from "../_server/seed";
import { createRequest, updateRequest } from "../_server/service";
const url = "https://www.musinsa.com/products/123";
const head =
  '<meta property="og:title" content="상품"><meta property="og:image" content="https://image.msscdn.net/product.jpg">';
describe("shop price and discount", () => {
  it("reads current price, original price and the displayed shop discount rate", () => {
    const product = parseProductMetadata(
      head +
        '<meta property="product:price:amount" content="97890"><meta property="product:price:currency" content="KRW"><meta property="product:price:normal_price" content="139900"><meta property="product:price:sale_rate" content="30">',
      url,
    );
    expect(product).toMatchObject({
      price: 97890,
      originalPrice: 139900,
      discountRate: 30,
    });
  });
  it("reads a single KRW offer from Product JSON-LD", () => {
    expect(
      parseProductMetadata(
        head +
          '<script type="application/ld+json">{"@type":"Product","offers":{"price":"59,000","priceCurrency":"KRW"}}</script>',
        url,
      ),
    ).toMatchObject({ price: 59000, originalPrice: null, discountRate: null });
  });
  it("does not mistake an option price range for a discount", () => {
    expect(
      parseProductMetadata(
        head +
          '<script type="application/ld+json">{"@type":"Product","offers":{"@type":"AggregateOffer","lowPrice":10000,"highPrice":30000,"priceCurrency":"KRW"}}</script>',
        url,
      ),
    ).toMatchObject({ price: null, originalPrice: null, discountRate: null });
  });
  it("does not label foreign currency as KRW", () => {
    expect(
      parseProductMetadata(
        head +
          '<meta property="product:price:amount" content="100"><meta property="product:price:currency" content="USD">',
        url,
      ).price,
    ).toBeNull();
  });
  it("preserves a shop's rounded rate when it agrees with the two prices", () => {
    expect(productPricing(89050, 139000, 36).discountRate).toBe(36);
  });
  it("calculates the rate from real prices if a rate is absent or inconsistent", () => {
    expect(productPricing(80000, 100000).discountRate).toBe(20);
    expect(productPricing(80000, 100000, 90).discountRate).toBe(20);
  });
  it.each([
    [10000, 10000],
    [20000, 10000],
    [10000, null],
    [null, 10000],
  ])(
    "hides discount for missing or non-discounted prices %s / %s",
    (price, original) => {
      expect(productPricing(price, original, 30).discountRate).toBeNull();
    },
  );
  it.each(["ask", "", -1, Infinity, "12.50", "₩20,000"])(
    "does not invent a numeric price from %s",
    (price) => {
      expect(productPricing(price).price).toBeNull();
    },
  );
  it("stores pricing with the product and preserves it across concern edits", () => {
    const db = createSeed();
    const input = {
      creatorId: "seoa",
      productUrl: url,
      productName: "상품",
      brand: "브랜드",
      price: 80000,
      originalPrice: 100000,
      discountRate: 20,
      category: "의류" as const,
      concern: "고민",
      tags: [],
      bodySpec: {},
    };
    const id = createRequest(db, "member", input);
    expect(db.requests.find((row) => row.id === id)?.product).toMatchObject({
      price: 80000,
      originalPrice: 100000,
      discountRate: 20,
    });
    updateRequest(db, "member", id, {
      ...input,
      originalPrice: undefined,
      discountRate: undefined,
      concern: "수정한 고민",
    });
    expect(db.requests.find((row) => row.id === id)?.product.discountRate).toBe(
      20,
    );
    updateRequest(db, "member", id, { ...input, price: 100000 });
    expect(
      db.requests.find((row) => row.id === id)?.product.discountRate,
    ).toBeNull();
  });
});
