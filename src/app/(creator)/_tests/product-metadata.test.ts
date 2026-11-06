import { describe, expect, it } from "vitest";
import {
  isPublicIPv4,
  parseProductMetadata,
  validateProductPage,
} from "../_server/product-metadata";
import { validateProductImageUrl } from "../_lib/product-url";
import { createSeed } from "../_server/seed";
import { createRequest, updateRequest } from "../_server/service";
const url = "https://www.musinsa.com/products/123";
const first = "https://image.msscdn.net/images/first.jpg";
describe("product image and destination association", () => {
  it("uses the first Product gallery shot rather than a campaign Open Graph image", () => {
    const product = parseProductMetadata(
      `<meta property="og:image" content="https://image.msscdn.net/banner.jpg"><script type="application/ld+json">${JSON.stringify({ "@graph": [{ "@type": "Product", name: "실제 상품", brand: { name: "브랜드" }, image: [first, "https://image.msscdn.net/second.jpg"] }] })}</script>`,
      url,
    );
    expect(product).toMatchObject({
      url,
      image: first,
      name: "실제 상품",
      brand: "브랜드",
      price: null,
    });
  });
  it("reads Open Graph attributes in either order and decodes image query strings", () => {
    const product = parseProductMetadata(
      `<meta content='상품 &amp; 이름' property='og:title'><meta content='${first}?w=1200&amp;q=90' property='og:image'>`,
      url,
    );
    expect(product.name).toBe("상품 & 이름");
    expect(product.image).toBe(`${first}?w=1200&q=90`);
  });
  it("fails when a page has no image instead of substituting sample merchandise", () => {
    expect(() =>
      parseProductMetadata('<meta property="og:title" content="제품">', url),
    ).toThrow();
  });
  it.each([
    "https://www.musinsa.com/",
    "https://www.29cm.co.kr/search?keyword=bag",
    "https://www.wconcept.co.kr/",
  ])("rejects non-product pages: %s", (value) => {
    expect(() => validateProductPage(value)).toThrow();
  });
  it.each([
    "http://image.msscdn.net/a.jpg",
    "https://127.0.0.1/a.jpg",
    "https://image.msscdn.net.evil.example/a.jpg",
    "https://user:pass@image.msscdn.net/a.jpg",
  ])("rejects unsafe image sources: %s", (value) => {
    expect(() => validateProductImageUrl(value)).toThrow();
  });
  it.each([
    "127.0.0.1",
    "10.0.0.1",
    "169.254.169.254",
    "172.16.1.1",
    "192.168.1.1",
    "100.64.0.1",
    "0.0.0.0",
    "224.0.0.1",
  ])("does not connect to private or special IPv4 addresses: %s", (value) => {
    expect(isPublicIPv4(value)).toBe(false);
  });
  it("stores the selected image with its exact product URL and preserves it during text edits", () => {
    const db = createSeed();
    const input = {
      creatorId: "seoa",
      productUrl: url,
      productImage: first,
      productName: "실제 상품",
      brand: "브랜드",
      price: null,
      category: "의류" as const,
      concern: "고민",
      tags: [],
      bodySpec: {},
    };
    const id = createRequest(db, "member", input);
    expect(db.requests.find((r) => r.id === id)?.product).toMatchObject({
      url,
      image: first,
    });
    updateRequest(db, "member", id, {
      ...input,
      productImage: undefined,
      concern: "수정한 고민",
    });
    expect(db.requests.find((r) => r.id === id)?.product.image).toBe(first);
  });
});
