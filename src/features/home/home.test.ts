import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Home from "./home";
import Community from "../community/community";
import HomePage from "../../app/page";
import CommunityPage from "../../app/community/page";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock("../community/actions", () => ({}));

describe("홈과 커뮤니티 연결", () => {
  it("홈과 기존 피드를 서로 다른 경로로 제공한다", () => {
    expect(HomePage().type).toBe(Home);
    expect(CommunityPage().type).toBe(Community);
  });

  it("홈에는 두 줄 헤드라인과 서비스 소개가 있고 피드는 별도로 연결된다", () => {
    const html = renderToStaticMarkup(createElement(Home));
    expect(html).toContain("<span>살까 말까 망설여질 때,</span>");
    expect(html).toContain("<span>모두의 한 표를 만나보세요.</span>");
    expect(html).toContain("좋아하는 크리에이터의 선택은?");
    expect(html).toContain("살까 말까, 함께 골라요");
    expect(html).toContain("About me");
    expect(html).toMatch(/href="\/community"[^>]*>Explore the Feed<\/a>/);
    expect(html).not.toContain("살말 투표 커뮤니티");
  });

  it("홈의 Login은 큐레이션과 같은 공통 로그인 페이지로 연결된다", () => {
    const html = renderToStaticMarkup(createElement(Home));
    expect(html).toMatch(/<a\b(?=[^>]*href="\/login")[^>]*>Login<\/a>/);
    expect(html).not.toContain("<dialog");
  });

  it("커뮤니티 로고는 홈으로, Community 메뉴는 피드로 이동한다", () => {
    const html = renderToStaticMarkup(createElement(Community));
    expect(html).toMatch(
      /<a\b(?=[^>]*href="\/")(?=[^>]*aria-label="Buy or Not 홈")[^>]*>/,
    );
    expect(html).toMatch(
      /<a\b(?=[^>]*href="\/community")(?=[^>]*aria-current="page")[^>]*>Community/,
    );
  });
});
