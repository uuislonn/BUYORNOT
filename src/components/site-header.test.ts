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
  expect(html).toContain('href="/creators"');
  expect(html).toContain('href="/community"');
  expect(html).toContain(">로그인</button>");
});

it("로그인 상태에서는 내 계정을 표시하고 처리 중에는 중복 실행을 막는다", () => {
  const html = renderToStaticMarkup(
    createElement(SiteHeader, {
      currentPage: "community",
      onAccount: vi.fn(),
      loggedIn: true,
      busy: true,
    }),
  );
  expect(html).toMatch(/<button\b[^>]*disabled=""[^>]*aria-label="내 계정"/);
});

it("marks the current section on desktop and mobile and links real search and notification destinations", () => {
  const html = renderToStaticMarkup(
    createElement(SiteHeader, {
      currentPage: "creators",
      loggedIn: true,
      accountName: "지혜",
    }),
  );
  expect(
    html.match(
      /<a\b(?=[^>]*href="\/creators")(?=[^>]*aria-current="page")[^>]*>/g,
    ),
  ).toHaveLength(2);
  expect(html).toContain('aria-label="모바일 주 메뉴"');
  expect(html).toContain('href="/account?section=notifications"');
  expect(html).toContain('action="/search"');
  expect(html).not.toContain("formAction=");
  expect(html).toContain('name="q"');
  expect(html).toContain('aria-label="내 계정"');
});

it("keeps search collapsed as an accessible icon inside the header form", () => {
  const html = renderToStaticMarkup(
    createElement(SiteHeader, { currentPage: "creators" }),
  );
  expect(html).toMatch(
    /<button[^>]*aria-expanded="false"[^>]*aria-controls="site-search"[^>]*aria-label="검색 열기"[^>]*><svg/,
  );
  expect(html).toMatch(
    /<form[^>]*role="search"[^>]*data-expanded="false"[^>]*>/,
  );
  expect(html).toMatch(/<input[^>]*id="site-search"[^>]*disabled/);
  expect(html).not.toMatch(/<input[^>]*id="site-search"[^>]*\brequired\b/);
  expect(html).not.toContain("<dialog");
  expect(html.indexOf("</form>")).toBeLessThan(html.indexOf("</header>"));
  expect(html).toContain('action="/search"');
});

it("uses the same person icon even when a nickname and avatar are available", () => {
  const plain = renderToStaticMarkup(
    createElement(SiteHeader, { currentPage: "community", loggedIn: true }),
  );
  const personalized = renderToStaticMarkup(
    createElement(SiteHeader, {
      currentPage: "community",
      loggedIn: true,
      accountName: "지혜",
      accountAvatar: "/private-profile.jpg",
    }),
  );
  expect(personalized).toBe(plain);
  expect(personalized).toContain('aria-label="내 계정"');
  expect(personalized).toContain('href="/account"');
});
