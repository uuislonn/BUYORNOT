import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it, vi } from "vitest";
import { fetchProductHtml } from "../../../features/community/product-fetch";
import {
  runProductRefreshBatch,
  readRefreshedProduct,
} from "../_server/product-refresh";
import { POST } from "../../api/internal/product-refresh/route";

const sample = vi.hoisted(() => ({
  url: "https://www.musinsa.com/products/123",
  date: "2026-11-22T02:00:00+09:00",
}));
vi.mock("../../../features/community/store", () => ({
  store: {
    posts: new Map([
      [
        "example",
        {
          product: { url: sample.url, price: 29000 },
          createdAt: sample.date,
          visibility: "PUBLIC",
        },
      ],
    ]),
  },
}));
vi.mock("../../../features/community/product-fetch", () => ({
  fetchProductHtml: vi.fn(),
}));
vi.mock("../../../lib/auth/config", () => ({ authConfig: () => null }));
vi.mock("../../../lib/auth/local-test", () => ({
  localTestEnabled: () => false,
}));
vi.mock("node:timers/promises", () => ({ setTimeout: vi.fn(async () => {}) }));

it("persists verified metadata separately and retains it if a following run fails", async () => {
  const directory = await mkdtemp(join(tmpdir(), "product-refresh-test-"));
  vi.stubEnv("PRODUCT_REFRESH_DATA_DIR", directory);
  try {
    vi.mocked(fetchProductHtml).mockResolvedValueOnce({
      url: new URL(sample.url),
      html: '<script type="application/ld+json">{"@type":"Product","sku":"123","name":"새 상품명","brand":"브랜드","image":"https://image.msscdn.net/123.jpg","offers":{"price":19000,"priceCurrency":"KRW"}}</script>',
    });
    const now = Date.parse("2026-11-22T03:00:00+09:00");
    expect(await runProductRefreshBatch(now)).toMatchObject({
      done: true,
      attempted: 1,
      refreshed: 1,
    });
    const snapshot = await readRefreshedProduct(sample.url);
    expect(snapshot).toMatchObject({
      name: "새 상품명",
      brand: "브랜드",
      price: { price: 19000 },
    });
    expect(await runProductRefreshBatch(now)).toMatchObject({
      done: true,
      attempted: 0,
    });
    vi.mocked(fetchProductHtml).mockRejectedValueOnce(new Error("Unavailable"));
    expect(await runProductRefreshBatch(now + 86400000)).toMatchObject({
      done: true,
      attempted: 1,
      refreshed: 0,
    });
    expect(await readRefreshedProduct(sample.url)).toEqual(snapshot);
  } finally {
    vi.unstubAllEnvs();
    await rm(directory, { recursive: true, force: true });
  }
});

it("rejects a scheduled request without the configured secret", async () => {
  vi.stubEnv("PRODUCT_REFRESH_SECRET", "test-secret");
  try {
    const result = await POST(
      new Request("http://localhost/api/internal/product-refresh", {
        method: "POST",
      }),
    );
    expect(result.status).toBe(401);
  } finally {
    vi.unstubAllEnvs();
  }
});
