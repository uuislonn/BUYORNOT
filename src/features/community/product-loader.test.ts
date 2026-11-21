import { beforeEach, expect, it, vi } from "vitest";
import { fetchProductHtml } from "./product-fetch";
import { loadProduct } from "./product-loader";
import { seedPosts } from "./seed";

vi.mock("./product-fetch", () => ({ fetchProductHtml: vi.fn() }));
beforeEach(() => vi.mocked(fetchProductHtml).mockReset());

function mobilePage(id: string, name: string, brand: string, price: number) {
  const url = new URL(`https://m.musinsa.com/products/${id}`);
  const image = `https://image.msscdn.net/images/goods_img/${id}/photo.jpg`;
  return {
    url,
    html: `<script type="application/ld+json">${JSON.stringify({
      "@type": "Product",
      sku: id,
      name,
      brand: { name: brand },
      image: [image],
      offers: { price, priceCurrency: "KRW" },
    })}</script>`,
  };
}

it.each([
  ["5916487", "슈퍼노바 이즈 2 M JQ4254", "아디다스", 69300],
  ["6876776", "틴즈 여아 더블페이스 커브드 스터드 팬츠", "행텐 틴즈", 32600],
  ["4000000", "플리츠 커트러리", "리이제", 28000],
  [
    "4352381",
    "피그먼트 오버사이즈 후디드 스웨트 집업 [브라운]",
    "무신사 스탠다드",
    66390,
  ],
])(
  "uses the domestic mobile metadata for Musinsa product %s",
  async (id, name, brand, price) => {
    const url = `https://www.musinsa.com/products/${id}`;
    const page = mobilePage(id, name, brand, price);
    vi.mocked(fetchProductHtml).mockResolvedValueOnce(page);
    await expect(loadProduct(url)).resolves.toEqual({
      url,
      domain: "www.musinsa.com",
      name,
      brand,
      image: `https://image.msscdn.net/images/goods_img/${id}/photo.jpg`,
      price,
      currency: "KRW",
    });
    const [requested, , validate] = vi.mocked(fetchProductHtml).mock.calls[0];
    expect(requested).toBe(page.url.href);
    expect(validate?.(url).href).toBe(url);
    expect(() => validate?.("https://m.musinsa.com/products/1")).toThrow();
  },
);

it("coalesces desktop and legacy mobile URLs for the same product", async () => {
  const id = "1002345678";
  vi.mocked(fetchProductHtml).mockResolvedValueOnce(
    mobilePage(id, "Cardigan", "Brand", 12900),
  );
  const [desktop, mobile] = await Promise.all([
    loadProduct(`https://www.musinsa.com/products/${id}`),
    loadProduct(`https://m.musinsa.com/app/goods/${id}/?utm_source=share`),
  ]);
  expect(desktop.price).toBe(12900);
  expect(mobile.name).toBe(desktop.name);
  expect(fetchProductHtml).toHaveBeenCalledTimes(1);
});

it("uses a saved card only after the storefront cannot be reached", async () => {
  const product = seedPosts[0].product;
  vi.mocked(fetchProductHtml).mockRejectedValueOnce(new Error("403"));
  await expect(loadProduct(product.url)).resolves.toEqual(product);
  expect(fetchProductHtml).toHaveBeenCalledTimes(1);
});

it("reports an unavailable product without inventing its details", async () => {
  vi.mocked(fetchProductHtml).mockRejectedValueOnce(new Error("403"));
  await expect(
    loadProduct("https://www.musinsa.com/products/999999999"),
  ).rejects.toThrow("쇼핑몰에 연결하지 못했습니다");
});

it("keeps a card when an otherwise valid product does not expose its price", async () => {
  const url = new URL("https://m.musinsa.com/products/900723");
  vi.mocked(fetchProductHtml).mockResolvedValueOnce({
    url,
    html: '<meta property="og:title" content="Cardigan"><meta property="og:image" content="https://image.msscdn.net/900723.jpg"><meta property="product:price:amount" content="회원가 공개">',
  });
  await expect(loadProduct(url.href)).resolves.toMatchObject({
    name: "Cardigan",
    price: 0,
  });
});

it("returns the domestic sale price, percent off and regular price for the preview", async () => {
  const page = mobilePage("5916491", "러닝화", "아디다스", 69300);
  page.html = page.html.replace(
    '"priceCurrency":"KRW"',
    '"priceCurrency":"KRW","priceSpecification":[{"priceType":"https://schema.org/StrikethroughPrice","price":99000,"priceCurrency":"KRW"}]',
  );
  vi.mocked(fetchProductHtml).mockResolvedValueOnce(page);
  await expect(
    loadProduct("https://www.musinsa.com/products/5916491"),
  ).resolves.toMatchObject({
    price: 69300,
    originalPrice: 99000,
    discountRate: 30,
  });
});

it("keeps distinct Olive Young IDs and uses a verified card when the storefront blocks lookup", async () => {
  const products = [
    ["A000000125507", "1025 독도 토너 200ml", 12900],
    ["A000000241210", "더 쥬시 래스팅 틴트", 9900],
  ] as const;
  for (const [id, name, price] of products) {
    vi.mocked(fetchProductHtml).mockRejectedValueOnce(new Error("403"));
    await expect(
      loadProduct(
        `https://m.oliveyoung.co.kr/m/goods/getGoodsDetail.do?goodsNo=${id}&trackingCd=search`,
      ),
    ).resolves.toMatchObject({
      name,
      price,
      image: expect.stringContaining(id),
    });
  }
  expect(fetchProductHtml).toHaveBeenCalledTimes(2);
});

it("loads a product on a public brand store without adding the store to an allowlist", async () => {
  const url = new URL(
    "https://shop.brand-name.co.kr/product/knit/123/category/3",
  );
  vi.mocked(fetchProductHtml).mockResolvedValueOnce({
    url,
    html: '<script type="application/ld+json">{"@type":"Product","sku":"AB-123","name":"울 니트","brand":{"name":"브랜드"},"image":"https://cdn.shopify.com/photo.jpg","offers":{"price":39000,"priceCurrency":"KRW"}}</script>',
  });
  await expect(
    loadProduct(url.href + "/?utm_source=share"),
  ).resolves.toMatchObject({
    url: url.href,
    name: "울 니트",
    brand: "브랜드",
    price: 39000,
    image: "https://cdn.shopify.com/photo.jpg",
  });
});

it("does not treat a generic webpage as a brand product", async () => {
  const url = new URL("https://shop.brand-name.co.kr/product/not-an-item");
  vi.mocked(fetchProductHtml).mockResolvedValueOnce({
    url,
    html: '<meta property="og:title" content="Brand"><meta property="og:image" content="https://shop.brand-name.co.kr/logo.jpg">',
  });
  await expect(loadProduct(url.href)).rejects.toThrow(
    "공개 상품 정보를 찾지 못했어요",
  );
});

it("reads sale and regular prices from public storefront product metadata", async () => {
  const url = new URL("https://store.brand-name.co.kr/product/cap/22");
  vi.mocked(fetchProductHtml).mockResolvedValueOnce({
    url,
    html: '<meta property="og:type" content="product"><meta property="og:title" content="로고 캡"><meta property="og:site_name" content="브랜드"><meta property="og:image" content="https://store.brand-name.co.kr/cap.jpg"><meta property="product:price:currency" content="KRW"><meta property="product:price:amount" content="39000"><meta property="product:sale_price:currency" content="KRW"><meta property="product:sale_price:amount" content="35100">',
  });
  await expect(loadProduct(url.href)).resolves.toMatchObject({
    brand: "브랜드",
    price: 35100,
    originalPrice: 39000,
    discountRate: 10,
  });
});
