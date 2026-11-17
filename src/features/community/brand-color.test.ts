import { expect, it } from "vitest";
import { brandColorForPixels } from "./brand-color";

it("밝은 배경에는 순수 검정, 어두운 배경에는 순수 흰색을 사용한다", () => {
  expect(brandColorForPixels(new Uint8ClampedArray([255, 255, 255, 255]))).toBe(
    "#000",
  );
  expect(brandColorForPixels(new Uint8ClampedArray([30, 30, 30, 255]))).toBe(
    "#fff",
  );
  expect(brandColorForPixels(new Uint8ClampedArray([180, 180, 180, 255]))).toBe(
    "#000",
  );
  expect(brandColorForPixels(new Uint8ClampedArray([]))).toBe("#000");
});
