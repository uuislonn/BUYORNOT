import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it, vi } from "vitest";
import { SiteHeader } from "./site-header";
import Home from "../features/home/home";
import Community from "../features/community/community";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../features/community/actions", () => ({}));

it("홈과 커뮤니티는 같은 상단바를 사용하고 현재 메뉴만 구분한다", () => {
  const header = (component: typeof Home) =>
    renderToStaticMarkup(createElement(component))
      .match(/<header\b[\s\S]*?<\/header>/)![0]
      .replace(/ aria-current="page"/g, "");
  expect(header(Home)).toBe(header(Community));
});

it("모든 화면의 메뉴는 홈·큐레이션 룸·커뮤니티로 연결된다", () => {
  const html = renderToStaticMarkup(
    createElement(SiteHeader, {
      currentPage: "community",
      onAccount: vi.fn(),
    }),
  );
  expect(html).toContain('href="/"');
  expect(html).toContain('href="/creators/seoa"');
  expect(html).toContain('href="/community"');
  expect(html).toContain(">Login</button>");
});

it("로그인 상태에서는 Logout을 표시하고 처리 중에는 중복 실행을 막는다", () => {
  const html = renderToStaticMarkup(
    createElement(SiteHeader, {
      currentPage: "community",
      onAccount: vi.fn(),
      loggedIn: true,
      busy: true,
    }),
  );
  expect(html).toMatch(/<button\b[^>]*disabled=""[^>]*>Logout<\/button>/);
});
