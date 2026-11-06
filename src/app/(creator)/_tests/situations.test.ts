import { describe, it, expect } from "vitest";
import { SITUATIONS, retainSituationTags } from "../_lib/situations";
describe("category-specific situation choices", () => {
  it("offers makeup situations rather than outfit situations for beauty", () => {
    expect(SITUATIONS.뷰티.tags).toContain("데일리메이크업");
    expect(SITUATIONS.뷰티.tags).not.toContain("하객룩");
    expect(SITUATIONS.뷰티.tags).not.toContain("출근룩");
  });
  it("clears incompatible selections and keeps shared selections when category changes", () => {
    expect(
      retainSituationTags(["하객룩", "출근룩", "퍼스널컬러"], "뷰티"),
    ).toEqual(["퍼스널컬러"]);
    expect(retainSituationTags(["데일리", "여행", "수납력"], "신발")).toEqual([
      "데일리",
      "여행",
    ]);
    expect(retainSituationTags(["데일리메이크업"], "의류")).toEqual([]);
  });
  it("supports all product categories with valid distinct labels and at most four selections", () => {
    for (const situation of Object.values(SITUATIONS)) {
      expect(new Set(situation.tags).size).toBe(situation.tags.length);
      expect(situation.tags.every((tag) => tag.length <= 16)).toBe(true);
    }
    expect(
      retainSituationTags([...SITUATIONS.잡화.tags, "데일리"], "잡화"),
    ).toHaveLength(4);
    expect(retainSituationTags(["데일리", "데일리"], "잡화")).toEqual([
      "데일리",
    ]);
  });
});
