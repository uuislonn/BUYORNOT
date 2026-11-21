import { expect, it } from "vitest";
import { SOPHY_ITEMS, videoItemUrl } from "../_content/sophy-video";
import { existsSync, readFileSync } from "node:fs";
import { SOPHY_LINKED_ITEMS } from "../_content/sophy-products";
import { addDirectoryRooms, directoryDatabase } from "../_server/directory";
import { snapshot } from "../_server/service";
it("keeps every video item traceable without inventing shopping links or definitive votes", () => {
  expect(SOPHY_ITEMS).toHaveLength(51);
  expect(new Set(SOPHY_ITEMS.map((item) => item.id)).size).toBe(51);
  for (const item of SOPHY_ITEMS) {
    expect(videoItemUrl(item.seconds)).toMatch(
      /^https:\/\/www.youtube.com\/watch\?v=yVzpx4rnB5E&t=\d+s$/,
    );
  }
  expect(SOPHY_ITEMS.find((item) => item.seconds === 1902)?.verdict).toBe(
    "CONDITIONAL",
  );
  expect(SOPHY_ITEMS.find((item) => item.seconds === 554)?.verdict).toBe(
    "REFERENCE",
  );
  expect(SOPHY_ITEMS.find((item) => item.seconds === 53)?.verdict).toBe("NOT");
  expect(SOPHY_ITEMS.find((item) => item.seconds === 248)?.verdict).toBe("BUY");
});
it("every displayed item has a matched sales page and a real product photo", () => {
  expect(SOPHY_LINKED_ITEMS.length).toBeGreaterThanOrEqual(26);
  for (const item of SOPHY_LINKED_ITEMS) {
    expect(item.seconds).toBe(item.sale.sourceSeconds);
    expect(new URL(item.sale.product.url).protocol).toBe("https:");
    expect(item.sale.product.url).not.toContain("youtube");
    expect(item.sale.product.image).toMatch(/^\/curation-products\/sophy\//);
    const path = `public${item.sale.product.image}`;
    expect(existsSync(path)).toBe(true);
    expect(readFileSync(path).length).toBeGreaterThan(1000);
  }
});

it("serves Sophy products through the same room snapshot as Soal", () => {
  const db = directoryDatabase();
  const room = snapshot(db, null, "sophy", false);
  expect(room.creator.title).toBe("소피의 큐레이션 룸");
  expect(room.creator.cover).toBe("/curation-products/sophy/banner.jpg");
  expect(room.requests).toHaveLength(SOPHY_LINKED_ITEMS.length);
  for (const item of SOPHY_LINKED_ITEMS) {
    const request = room.requests.find(
      (r) => r.product.url === item.sale.product.url,
    )!;
    expect(request.product.image).toBe(item.sale.product.image);
    expect(request.concern).toBe(item.concern);
    if (item.verdict === "BUY" || item.verdict === "NOT") {
      expect(request.status).toBe(item.verdict);
      expect(
        room.evaluations.find((e) => e.requestId === request.id)?.comment,
      ).toContain(item.reason);
    } else expect(request.status).toBe("ING");
  }
});

it("opens verified official-store links without accepting arbitrary URLs", async () => {
  const { getAffiliateLink, validateProductUrl } =
    await import("../_lib/product-url");
  for (const item of SOPHY_LINKED_ITEMS)
    expect(getAffiliateLink(item.sale.product.url)).toBe(item.sale.product.url);
  expect(() => getAffiliateLink("https://example.com/product")).toThrow();
  expect(() =>
    validateProductUrl("https://www.deinet.co.kr/arbitrary"),
  ).toThrow();
});

it("refreshes existing Sophy sales cards without losing activity", () => {
  const db = directoryDatabase();
  const request = db.requests.find((r) => r.id === "sophy-product-523")!;
  const before = structuredClone(request);
  const count = db.requests.length;
  request.product.url = "https://www.musinsa.com/products/5316468";
  request.product.price = 187200;
  addDirectoryRooms(db);
  expect(request.product.url).toContain("aakam.kr");
  expect(request.product.price).toBe(145600);
  expect({ ...request, product: before.product }).toEqual(before);
  expect(db.requests).toHaveLength(count);
  expect(
    SOPHY_LINKED_ITEMS.every(
      (item) => !item.sale.product.url.includes("musinsa.com"),
    ),
  ).toBe(true);
});
