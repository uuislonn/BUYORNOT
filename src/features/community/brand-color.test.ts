import { expect, it, vi } from "vitest";
import {
  brandColorForPixels,
  brandSampleUrl,
  readBrandColor,
} from "./brand-color";

it.each([
  [[255, 255, 255, 255], "#000"],
  [[248, 248, 247, 255], "#000"],
  [[30, 30, 30, 255], "#fff"],
  [[180, 180, 180, 255], "#fff"],
  [[237, 238, 240, 255], "#000"],
  [[242, 242, 242, 255], "#000"],
  [[230, 230, 230, 255], "#fff"],
  [[255, 245, 220, 255], "#fff"],
  [[255, 255, 0, 255], "#fff"],
  [[255, 255, 255, 0], "#fff"],
  [[], "#fff"],
])("흰 배경만 검정색, 나머지는 흰색: %j → %s", (pixels, expected) => {
  expect(brandColorForPixels(new Uint8ClampedArray(pixels as number[]))).toBe(
    expected,
  );
});

it("무신사 썸네일 대신 CORS가 허용된 동일 원본으로 색상만 분석한다", () => {
  expect(
    brandSampleUrl(
      "https://image.msscdn.net/thumbnails/images/goods_img/20240220/3884791/3884791_17085041637845_big.jpg?w=1000",
    ),
  ).toBe(
    "https://image.msscdn.net/images/goods_img/20240220/3884791/3884791_17085041637845_big.jpg",
  );
  const other = "https://img.29cm.co.kr/item/bag.jpg?w=1000";
  expect(brandSampleUrl(other)).toBe(other);
});

it("브랜드명 뒤가 대부분 흰색일 때만 검정색을 사용한다", () => {
  const white = [255, 255, 255, 255];
  const colored = [255, 220, 180, 255];
  expect(
    brandColorForPixels(
      new Uint8ClampedArray([...Array(9).fill(white).flat(), ...colored]),
    ),
  ).toBe("#000");
  expect(
    brandColorForPixels(
      new Uint8ClampedArray([
        ...Array(8).fill(white).flat(),
        ...colored,
        ...colored,
      ]),
    ),
  ).toBe("#fff");
});

it("이미지 분석을 지원하지 않으면 기본 흰색으로 표시한다", () => {
  vi.stubGlobal("document", {
    createElement: () => ({ getContext: () => null }),
  });
  try {
    expect(readBrandColor({} as HTMLImageElement)).toBe("#fff");
  } finally {
    vi.unstubAllGlobals();
  }
});
