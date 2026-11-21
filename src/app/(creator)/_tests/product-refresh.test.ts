import { expect, it } from "vitest";
import { refreshQueue } from "../_server/product-refresh";
import { validateProductPage } from "../_server/product-metadata";

it("canonicalizes mobile detail links for curation registration", () => {
  expect(
    validateProductPage(
      "https://m.musinsa.com/app/goods/5951337/?utm_source=app",
    ),
  ).toBe("https://www.musinsa.com/products/5951337");
  expect(validateProductPage("https://m.29cm.co.kr/product/123/")).toBe(
    "https://www.29cm.co.kr/products/123",
  );
});

it("deduplicates product links, preserves priority and rotates older products over three Seoul days", () => {
  const now = Date.parse("2026-11-21T18:00:00Z");
  const fresh = {
    url: "https://www.musinsa.com/products/13",
    date: new Date(now).toISOString(),
    views: 0,
  };
  const popular = {
    url: "https://www.musinsa.com/products/14",
    date: "2026-01-02",
    views: 100,
  };
  const old = {
    url: "https://www.musinsa.com/products/15",
    date: "2026-01-02",
    views: 0,
  };
  const days = [0, 1, 2].map((day) =>
    refreshQueue(
      [
        old,
        { ...fresh, url: "https://m.musinsa.com/app/goods/13?utm_medium=app" },
        fresh,
        popular,
        { ...fresh, url: "https://example.org/product/19" },
      ],
      now + day * 86400000,
    ),
  );
  for (const queue of days)
    expect(queue.slice(0, 2)).toEqual([fresh.url, popular.url]);
  expect(days.flat().filter((url) => url === old.url)).toHaveLength(1);
  expect(days.flat().filter((url) => url === fresh.url)).toHaveLength(3);
});
