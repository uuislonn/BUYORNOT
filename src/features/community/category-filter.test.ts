import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { CategoryFilter } from "./category-filter";
import { categories } from "./types";

it("기존 카테고리를 유지하며 현재 필터 하나만 선택 상태로 표시한다", () => {
  const html = renderToStaticMarkup(
    createElement(CategoryFilter, {
      categories,
      value: "뷰티",
      onChange: vi.fn(),
    }),
  );
  expect(html).toContain('aria-label="카테고리"');
  expect(html.match(/aria-pressed="true"/g)).toHaveLength(1);
  expect(html).toMatch(/aria-pressed="true"[^>]*>뷰티<\/button>/);
  expect(html).toContain(">ALL</button>");
  expect(html.match(/<button\b/g)).toHaveLength(categories.length);
});
