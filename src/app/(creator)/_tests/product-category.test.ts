import { expect, it } from "vitest";
import { CATEGORIES } from "../_lib/types";
import { createSeed } from "../_server/seed";
import { normalizeProductCategories } from "../_lib/product-category";

it("removes the luxury tier from filters and reclassifies saved products by item type", () => {
  expect(CATEGORIES).toEqual(["전체", "의류", "뷰티", "신발", "잡화"]);
  const db = createSeed();
  const examples = [
    ["프라다 가죽 로퍼", "신발"],
    ["막스마라 울 코트", "의류"],
    ["샤넬 클래식 숄더백", "잡화"],
    ["디올 립스틱", "뷰티"],
  ] as const;
  for (const [index, [name]] of examples.entries()) {
    db.requests[index].product.name = name;
    Object.assign(db.requests[index].product, { category: "명품" });
    db.requests[index].tags = ["명품", "데일리"];
  }
  const ids = db.requests.map((post) => post.id);
  normalizeProductCategories(db);
  for (const [index, [, category]] of examples.entries()) {
    expect(db.requests[index].product.category).toBe(category);
    expect(db.requests[index].tags).toEqual([category, "데일리"]);
  }
  expect(db.requests.map((post) => post.id)).toEqual(ids);
});
