import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { SortMenu } from "./sort-menu";

it.each([
  ["latest", "최신순"],
  ["views", "조회수순"],
  ["votes", "투표순"],
])("현재 정렬 %s을 기본 글씨로 표시하고 메뉴는 닫아 둔다", (value, label) => {
  const html = renderToStaticMarkup(
    createElement(SortMenu, { value, onChange: vi.fn() }),
  );
  expect(html).toContain(`게시글 정렬: ${label}`);
  expect(html).toContain('aria-expanded="false"');
  expect(html).toContain('aria-haspopup="menu"');
  expect(html).not.toContain('role="menu"');
});

it("supports curation ordering without changing community defaults", () => {
  const html = renderToStaticMarkup(
    createElement(SortMenu, {
      value: "oldest",
      label: "정렬",
      options: [
        { value: "latest", label: "최신순" },
        { value: "oldest", label: "오래된순" },
      ],
      onChange: vi.fn(),
    }),
  );
  expect(html).toContain('aria-label="정렬: 오래된순"');
  expect(html).toContain('aria-haspopup="menu"');
});
