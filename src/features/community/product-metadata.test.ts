import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { parseProductMetadata } from "./product-metadata";
import { ProductPreview } from "./product-preview";

const url = new URL("https://www.musinsa.com/products/7096804");
const product = {
  "@type": "Product",
  sku: "7096804",
  name: "95 바시티 후드 가디건-네이비",
  brand: { name: "비터셀즈" },
  image: [
    "https://image.msscdn.net/images/goods_img/20260818/7096804/photo.jpg",
  ],
  offers: { price: 101370, priceCurrency: "KRW" },
};
const html = (data: unknown) =>
  `<script type="application/ld+json">${JSON.stringify(data)}</script>`;

describe("실제 상품 메타데이터", () => {
  it("무신사 Product JSON-LD에서 실제 필드를 읽는다", () => {
    expect(parseProductMetadata(html(product), url)).toMatchObject({
      name: product.name,
      brand: "비터셀즈",
      price: 101370,
      image: product.image[0],
      url: url.href,
    });
  });
  it("29CM의 ImageObject 배열과 그래프·Offer 배열을 지원한다", () => {
    const page = html({
      "@graph": [
        {
          ...product,
          sku: "4149783",
          name: "바토백 / 블랙",
          image: [{ contentUrl: "https://img.29cm.co.kr/item/bag.jpg" }],
          offers: [{ price: "96,000", priceCurrency: "KRW" }],
        },
      ],
    });
    expect(
      parseProductMetadata(
        page,
        new URL("https://www.29cm.co.kr/products/4149783"),
      ),
    ).toMatchObject({
      name: "바토백 / 블랙",
      price: 96000,
      image: "https://img.29cm.co.kr/item/bag.jpg",
    });
  });
  it("추천 상품이 함께 있어도 링크와 일치하는 상품을 고른다", () => {
    expect(
      parseProductMetadata(
        html([{ ...product, sku: "9", name: "추천 상품" }, product]),
        url,
      ).name,
    ).toBe(product.name);
    expect(() =>
      parseProductMetadata(html({ ...product, sku: "9" }), url),
    ).toThrow("일치하지");
  });
  it("잘못된 JSON-LD가 있어도 Open Graph를 읽고 HTML 엔티티를 해석한다", () => {
    const page = `<script type="application/ld+json">invalid</script><meta content='셔츠 &amp; 니트' property='og:title'><meta property="og:image" content="https://image.msscdn.net/shirt.jpg?w=500&amp;format=webp"><meta content="59,000" property="product:price:amount"><meta property="product:price:currency" content="KRW">`;
    expect(parseProductMetadata(page, url)).toMatchObject({
      name: "셔츠 & 니트",
      price: 59000,
      image: "https://image.msscdn.net/shirt.jpg?w=500&format=webp",
    });
  });
  it.each([
    { ...product, name: "" },
    { ...product, image: [] },
    { ...product, image: "javascript:alert(1)" },
    { ...product, image: "https://127.0.0.1/photo.jpg" },
    { ...product, image: "https://evil.test/photo.jpg" },
    { ...product, offers: { price: 0 } },
    { ...product, offers: { price: "not a price" } },
    { ...product, offers: { price: 50, priceCurrency: "USD" } },
  ])(
    "불완전하거나 안전하지 않은 데이터를 가짜 상품으로 표시하지 않는다",
    (data) => {
      expect(() => parseProductMetadata(html(data), url)).toThrow();
    },
  );
  it("미리보기에 사진·실제 상품명·한국식 가격을 표시한다", () => {
    const preview = renderToStaticMarkup(
      createElement(ProductPreview, {
        product: parseProductMetadata(html(product), url),
      }),
    );
    expect(preview).toContain(product.name);
    expect(preview).toContain("101,370");
    expect(preview).toContain('src="https://image.msscdn.net/');
    expect(preview).not.toContain(
      "실제 상품명·가격은 쇼핑몰에서 확인해 주세요",
    );
    expect(preview).not.toContain("Dummy");
  });
});
