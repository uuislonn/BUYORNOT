import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import RootLayout from "../app/layout";

it("shares a single footer with working destinations and accessible guide controls", () => {
  const html = renderToStaticMarkup(
    RootLayout({ children: createElement("main", null, "페이지 내용") }),
  );
  expect(html.match(/<footer\b/g)).toHaveLength(1);
  expect(html.indexOf("<footer")).toBeGreaterThan(html.indexOf("</main>"));
  for (const path of ["/", "/community", "/creators", "/account"])
    expect(html).toContain(`href="${path}"`);
  expect(html).toContain('aria-label="사이트 하단 정보"');
  expect(html).toContain('aria-labelledby="footer-guide-title"');
  expect(html).toContain('aria-label="안내 닫기"');
  expect(html).toContain("개인정보 안내");
  expect(html).not.toContain('href="#"');
  expect(html).not.toContain("mailto:");
});
