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
    expect(html).toContain("혼자 고민하던 당신에게");
    expect(html).toContain("선택은 생각보다 쉽지 않으니까요.");
    expect(html).toContain("고민을 나누고, 취향을 발견하는 방법");
    expect(html).toContain('href="/community"');
    expect(html).not.toContain("살말 투표 커뮤니티");
  });

  it("홈의 Login은 큐레이션과 같은 공통 로그인 페이지로 연결된다", () => {
    const html = renderToStaticMarkup(createElement(Home));
    expect(html).toMatch(/<a\b(?=[^>]*href="\/login")[^>]*>로그인<\/a>/);
    expect(html).not.toContain("<dialog");
  });

  it("다이얼 중앙 링크는 회전 레이어 밖에 있고 드래그 대체 조작을 제공한다", () => {
    const html = renderToStaticMarkup(createElement(Home));
    expect(html).toContain('aria-label="직접 돌려보는 상품 다이얼"');
    expect(html).toContain('tabindex="0"');
    expect(html).toContain('aria-label="다이얼 왼쪽으로 돌리기"');
    expect(html).toContain('aria-label="다이얼 오른쪽으로 돌리기"');
    expect(html).toContain('href="/creators/seoa"');
    const center = html.indexOf(
      'href="/login"',
      html.indexOf('aria-label="직접 돌려보는 상품 다이얼"'),
    );
    expect(center).toBeGreaterThan(
      html.indexOf(
        "</svg>",
        html.indexOf('aria-label="직접 돌려보는 상품 다이얼"'),
      ),
    );
  });
  it("체크무늬 대신 교체용 이미지 컨테이너와 시안의 세 기능을 제공한다", () => {
    const html = renderToStaticMarkup(createElement(Home));
    expect(html).not.toContain("placeholder.png");
    expect(html).not.toContain("checker");
    for (const title of [
      "Buy or Not?",
      "취향이 통하는 발견",
      "나의 추천이 필요한 누군가에게",
    ])
      expect(html).toContain(title);
    expect(html.indexOf("혼자 고민하던 당신에게")).toBeLessThan(
      html.indexOf("선택은 생각보다 쉽지 않으니까요."),
    );
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
