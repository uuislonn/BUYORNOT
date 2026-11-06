import { describe, expect, it } from "vitest";
import {
  createSeed,
  PRODUCT_FIXTURES,
  refreshSeedCatalog,
} from "../_server/seed";
import { effectiveStatus } from "../_lib/policy";
import {
  validateProductUrl,
  validateProductImageUrl,
} from "../_lib/product-url";
const now = Date.parse("2026-10-27T04:00:00Z");
describe("creator catalog", () => {
  it("offers 12 products per category and at least 10 unanswered examples each", () => {
    const visible = createSeed(now).requests.filter(
      (row) => effectiveStatus(row, now) === "ING",
    );
    for (const category of ["의류", "뷰티", "신발", "잡화"]) {
      expect(
        PRODUCT_FIXTURES.filter((p) => p.category === category),
      ).toHaveLength(12);
      expect(
        visible.filter((row) => row.product.category === category).length,
      ).toBeGreaterThanOrEqual(10);
    }
    expect(new Set(visible.map((row) => row.product.url)).size).toBe(
      visible.length,
    );
    expect(new Set(PRODUCT_FIXTURES.map((product) => product.url)).size).toBe(
      PRODUCT_FIXTURES.length,
    );
    for (const product of PRODUCT_FIXTURES) {
      expect(validateProductUrl(product.url)).toBe(product.url);
      expect(validateProductImageUrl(product.image)).toBe(product.image);
      expect(product.image).toContain(
        new URL(product.url).pathname.split("/").at(-1),
      );
      expect(product.price).toBeGreaterThan(0);
    }
  });
  it("updates demo examples without restoring deleted original posts or changing user decisions", () => {
    const db = createSeed(now);
    db.requests = db.requests.filter((row) => /^req-[2-7]$/.test(row.id));
    const custom = {
      ...structuredClone(db.requests[0]),
      id: "user-created-post",
      concern: "사용자가 쓴 고민",
    };
    db.requests.push(custom);
    const request = db.requests.find((row) => row.id === "req-2")!;
    request.product.name = "이전 샘플 상품";
    request.status = "BUY";
    db.hearts[request.id] = ["member"];
    refreshSeedCatalog(db, now);
    expect(db.requests.some((row) => row.id === "req-1")).toBe(false);
    expect(request.product.name).toBe(PRODUCT_FIXTURES[1].name);
    expect(request.status).toBe("BUY");
    expect(db.hearts[request.id]).toEqual(["member"]);
    expect(db.requests.find((row) => row.id === custom.id)).toEqual(custom);
    expect(db.requests.some((row) => row.id === "req-18")).toBe(true);
  });
  it("adds the expanded catalog without restoring deleted previous examples", () => {
    const db = createSeed(now);
    db.requests = db.requests.filter(
      (row) => Number(row.id.slice(4)) <= 18 && row.id !== "req-8",
    );
    refreshSeedCatalog(db, now, 18);
    expect(db.requests.some((row) => row.id === "req-8")).toBe(false);
    expect(db.requests.some((row) => row.id === "req-48")).toBe(true);
    expect(db.requests).toHaveLength(47);
  });
});
