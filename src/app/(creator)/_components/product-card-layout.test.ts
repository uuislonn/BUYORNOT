import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ProductCardBrand } from "./product-card-brand";
import { ProductCardLayout } from "./product-card-layout";

it("카테고리를 중복 없이 첫 해시태그로 표시한다", () => {
  const html = renderToStaticMarkup(
    createElement(ProductCardLayout, {
      author: "서연",
      product: { name: "가디건", url: "https://example.com", price: 90000 },
      image: null,
      actions: "저장 버튼",
      commentAction: "댓글 버튼",
      concern: "데님에 어울릴까요?",
      category: "의류",
      tags: ["데일리", "#의류", "의류", "출근룩"],
    }),
  );

  expect(html.match(/#[^<]+/g)).toEqual(["#의류", "#데일리", "#출근룩"]);
  const labels = [
    "서연",
    "저장 버튼",
    "가디건",
    "데님에 어울릴까요?",
    "#의류",
    "댓글 버튼",
  ];
  expect(labels.map((label) => html.indexOf(label))).toEqual(
    labels.map((label) => html.indexOf(label)).sort((a, b) => a - b),
  );
});

it("브랜드 행을 사진 아래와 본문 위에 표시하고 로고가 없으면 별표를 표시한다", () => {
  const html = renderToStaticMarkup(
    createElement(ProductCardLayout, {
      author: "서연",
      product: {
        name: "가디건",
        brand: "OAFISH",
        url: "https://example.com",
        price: null,
      },
      image: "상품 사진",
      concern: "고민 본문",
      category: "의류",
    }),
  );
  expect(html).toContain("/brand-logos/oafish.png");
  expect(html.indexOf("상품 사진")).toBeLessThan(html.indexOf(">OAFISH<"));
  expect(html.indexOf(">OAFISH<")).toBeLessThan(html.indexOf("고민 본문"));
  const fallback = renderToStaticMarkup(
    createElement(ProductCardBrand, { brand: "다른 브랜드" }),
  );
  expect(fallback).toContain(">*<");
  expect(fallback).toContain("다른 브랜드");
});
