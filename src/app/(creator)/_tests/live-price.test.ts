import { describe, expect, it, vi } from "vitest";
import { fetchProductHtml } from "../../../features/community/product-fetch";
import { livePriceTarget, loadLivePrice } from "../_server/live-price";
import { parseLiveProductPricing } from "../_server/product-metadata";
import { PRICE_REFRESH_MS } from "../_lib/live-price";

vi.mock("../../../features/community/product-fetch", () => ({
  fetchProductHtml: vi.fn(),
}));

const wonPrice = (price: number) =>
  `<meta property="product:price:amount" content="${price}">
   <meta property="product:price:currency" content="KRW">
   <meta property="product:price:normal_price" content="100000">`;

describe("자동 가격 확인", () => {
  it("상품 링크만 조회하고 다른 상품으로의 리디렉션은 거부한다", () => {
    const target = livePriceTarget(
      "https://m.musinsa.com/products/7096804?utm_source=test",
    );
    expect(target?.url.href).toBe("https://www.musinsa.com/products/7096804");
    expect(() =>
      target?.validate("https://www.musinsa.com/products/2"),
    ).toThrow();
    expect(livePriceTarget("https://www.musinsa.com/")).toBeNull();
    expect(
      livePriceTarget(
        "https://nothing-written.com/product/detail.html?product_no=1",
      ),
    ).toBeNull();
    const official = livePriceTarget(
      "https://nothing-written.com/product/detail.html?product_no=5535",
    );
    expect(official?.official).toBe(true);
    expect(() => official?.validate("https://example.com/")).toThrow();
  });

  it("공식몰의 미확인 통화와 외화는 원화로 표시하지 않는다", () => {
    expect(parseLiveProductPricing(wonPrice(85000), true)).toMatchObject({
      price: 85000,
      originalPrice: 100000,
      discountRate: 15,
    });
    expect(
      parseLiveProductPricing(wonPrice(85000).replace("KRW", "USD"), true)
        .price,
    ).toBeNull();
    expect(
      parseLiveProductPricing(
        '<meta property="product:price:amount" content="85">',
        true,
      ).price,
    ).toBeNull();
  });

  it("동시 조회를 합치고 만료 후 새 값을 확인하며 실패 시 마지막 가격을 유지한다", async () => {
    vi.useFakeTimers();
    try {
      const fetchPage = vi.mocked(fetchProductHtml);
      const target = livePriceTarget("https://www.musinsa.com/products/123")!;
      fetchPage.mockResolvedValueOnce({
        html: wonPrice(85000),
        url: target.url,
      });
      const [first, shared] = await Promise.all([
        loadLivePrice(target),
        loadLivePrice(target),
      ]);
      expect(first).toEqual(shared);
      expect(first?.price).toBe(85000);
      expect(await loadLivePrice(target)).toEqual(first);
      expect(fetchPage).toHaveBeenCalledTimes(1);
      vi.advanceTimersByTime(PRICE_REFRESH_MS);
      fetchPage.mockResolvedValueOnce({
        html: wonPrice(72000),
        url: target.url,
      });
      const updated = await loadLivePrice(target);
      expect(updated?.price).toBe(72000);
      expect(updated?.checkedAt).not.toBe(first?.checkedAt);
      vi.advanceTimersByTime(PRICE_REFRESH_MS);
      fetchPage.mockRejectedValueOnce(new Error("Unavailable"));
      expect(await loadLivePrice(target)).toEqual(updated);
      expect(await loadLivePrice(target)).toEqual(updated);
      expect(fetchPage).toHaveBeenCalledTimes(3);
    } finally {
      vi.useRealTimers();
    }
  });
});

it("reads the discount from the Musinsa domestic offer's strikethrough price", () => {
  const html =
    '<script type="application/ld+json">{"@type":"Product","offers":{"price":69300,"priceCurrency":"KRW","priceSpecification":[{"priceType":"https://schema.org/StrikethroughPrice","price":99000,"priceCurrency":"KRW"}]}}</script>';
  expect(parseLiveProductPricing(html)).toEqual({
    price: 69300,
    originalPrice: 99000,
    discountRate: 30,
  });
});

it("keeps the goods number for an Olive Young product and rejects a different product", () => {
  const target = livePriceTarget(
    "https://m.oliveyoung.co.kr/m/goods/getGoodsDetail.do?goodsNo=A000000125507&ref=shop",
  );
  expect(target?.url.href).toBe(
    "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000125507",
  );
  expect(() =>
    target?.validate(
      "https://www.oliveyoung.co.kr/store/goods/getGoodsDetail.do?goodsNo=A000000241210",
    ),
  ).toThrow();
  expect(livePriceTarget("https://www.oliveyoung.co.kr/")).toBeNull();
});
